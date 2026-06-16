import { Router, Request, Response } from 'express';
import { Card } from '../models/Card';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import axios from 'axios';

const router = Router();

// Todas as rotas de scan exigem autenticação
router.use(requireAuth);
// Rate limit: 10 scans/minuto por usuário (protege custo da Anthropic API)
router.use(rateLimiter({ maxRequests: 10, windowMs: 60_000, message: 'Limite de 10 scans por minuto atingido.' }));

const ANTHROPIC_VISION_PROMPT = `Você é um especialista em cartas Pokémon TCG. Analise esta imagem com MUITA atenção.

IMPORTANTE: Leia o nome da carta exatamente como está escrito em inglês na parte superior da carta.
Se o nome estiver em outro idioma (português, japonês, etc.), traduza para o inglês correto do Pokémon TCG.
Exemplos: "Piplup" = "Piplup", "Charizard" = "Charizard", "Dracaufeu" = "Charizard".

Leia também o RODAPÉ da carta com atenção:
- Código do set (ex: "PFL", "SV", "BW", "XY", "SM") — aparece no canto inferior esquerdo
- Número da carta (ex: "027/094", "001/165") — aparece logo após o código do set

Responda APENAS com JSON no formato exato abaixo, sem texto adicional:

{
  "name": "nome exato da carta em inglês",
  "set": "nome completo do set em inglês",
  "setCode": "código do set lido no rodapé (ex: PFL, SV1, BW1)",
  "number": "número da carta sem o total (ex: 027, se estiver 027/094)",
  "condition": "NM|LP|MP|HP|DMG",
  "conditionReason": "motivo da condição em português em até 20 palavras",
  "confidence": 0.0
}

Critérios de condição:
- NM (Near Mint): sem marcas visíveis, superfície impecável
- LP (Lightly Played): pequenos desgastes nas bordas/cantos
- MP (Moderately Played): desgaste moderado, riscos leves na superfície
- HP (Heavily Played): muito desgastada, riscos e marcas visíveis
- DMG (Damaged): dobras, rasgos, danos graves

confidence entre 0 e 1. Se a imagem for de baixa qualidade ou o nome não estiver legível, use confidence abaixo de 0.5.`;

async function callAnthropicVision(base64: string, mediaType: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sua_chave_aqui') {
    throw new Error('ANTHROPIC_API_KEY não configurada');
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: ANTHROPIC_VISION_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json() as { content: { type: string; text: string }[] };
  return data.content[0]?.text ?? '';
}

// Busca candidatos na PokéTCG API usando número + nome para máxima precisão
async function fetchCandidates(name: string, number?: string): Promise<Record<string, unknown>[]> {
  try {
    const apiKey = process.env.POKEMONTCG_API_KEY;
    const validKey = apiKey && apiKey !== 'sua_chave_aqui' ? apiKey : undefined;
    const headers: Record<string,string> = { 'Content-Type': 'application/json' };
    if (validKey) headers['X-Api-Key'] = validKey;

    // Estratégia 1: busca exata por nome + número (mais precisa)
    if (number) {
      const numClean = number.replace(/^0+/, ''); // remove zeros à esquerda: 027 → 27
      const q = `name:"${name}" number:${numClean}`;
      const res = await axios.get('https://api.pokemontcg.io/v2/cards', {
        params: { q, pageSize: 5 },
        headers,
        timeout: 15000,
      });
      if (res.data?.data?.length > 0) return res.data.data as Record<string, unknown>[];
    }

    // Estratégia 2: só pelo nome (fallback)
    const res = await axios.get('https://api.pokemontcg.io/v2/cards', {
      params: { q: `name:"${name}"`, pageSize: 8 },
      headers,
      timeout: 15000,
    });
    return (res.data?.data ?? []) as Record<string, unknown>[];
  } catch {
    return [];
  }
}

// POST /api/scan
router.post('/', async (req: Request, res: Response) => {
  try {
    const { image } = req.body as { image: string };
    if (!image) { res.status(400).json({ error: 'Imagem obrigatória (base64)' }); return; }

    const base64 = image.includes(',') ? image.split(',')[1] : image;
    const mediaType = image.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';

    const raw = await callAnthropicVision(base64, mediaType);

    let parsed: {
      name: string; set: string; setCode?: string; number?: string;
      condition: string; conditionReason: string; confidence: number;
    };
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[0] : raw);
    } catch {
      res.status(422).json({ error: 'Não foi possível identificar a carta', raw });
      return;
    }

    // Busca candidatos com nome + número para maior precisão
    const tcgCards = await fetchCandidates(parsed.name, parsed.number);

    // Resolve no MongoDB (onde _id = pokéTCG id)
    type TcgCard = { id: string; name: string; number: string; rarity?: string; set?: { id: string; name: string; series: string; images: { symbol: string; logo: string } }; images?: { small: string; large: string }; tcgplayer?: { prices?: Record<string, unknown> } };
    let candidates: object[] = [];
    if (tcgCards.length > 0) {
      const ids = (tcgCards as TcgCard[]).map((c) => c.id).filter(Boolean);
      const dbCards = await Card.find({ _id: { $in: ids } }).lean();
      const dbMap = Object.fromEntries(dbCards.map(c => [c._id as string, c]));

      candidates = (tcgCards as TcgCard[]).map((c) => {
        if (dbMap[c.id]) return dbMap[c.id];
        return {
          _id: c.id,
          name: c.name,
          number: c.number,
          rarity: c.rarity ?? '',
          set: { id: c.set?.id, name: c.set?.name, series: c.set?.series, images: c.set?.images },
          images: c.images,
          prices: c.tcgplayer?.prices ?? {},
        };
      });
    }

    res.json({ data: { identified: parsed, candidates } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('Erro no scan:', msg);
    res.status(500).json({ error: msg });
  }
});

export default router;
