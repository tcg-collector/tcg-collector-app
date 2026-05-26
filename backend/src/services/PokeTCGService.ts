import axios from 'axios';
import { Card } from '../models/Card';

const BASE_URL = 'https://api.pokemontcg.io/v2';

const apiKey = process.env.POKEMONTCG_API_KEY;
const validKey = apiKey && apiKey !== 'sua_chave_aqui' ? apiKey : undefined;

const client = axios.create({
  baseURL: BASE_URL,
  headers: validKey ? { 'X-Api-Key': validKey } : {},
  timeout: 30000,
});


export interface PokeTCGCard {
  id: string;
  name: string;
  number: string;
  supertype: string;
  subtypes?: string[];
  rarity?: string;
  artist?: string;
  nationalPokedexNumbers?: number[];
  types?: string[];
  set: {
    id: string;
    name: string;
    series: string;
    images: { symbol: string; logo: string };
  };
  images: { small: string; large: string };
  tcgplayer?: {
    prices?: {
      normal?: { low: number; mid: number; high: number; market: number };
      holofoil?: { low: number; mid: number; high: number; market: number };
      reverseHolofoil?: { low: number; mid: number; high: number; market: number };
    };
  };
}

/** Busca cartas da PokéTCG API e salva/atualiza no MongoDB */
export async function syncCards(query: string, pageSize = 20): Promise<number> {
  const response = await client.get<{ data: PokeTCGCard[]; totalCount: number }>(
    '/cards',
    { params: { q: query, pageSize, orderBy: '-set.releaseDate' } }
  );

  const cards = response.data.data;

  for (const c of cards) {
    const prices = {
      normal:          c.tcgplayer?.prices?.normal          ?? undefined,
      holofoil:        c.tcgplayer?.prices?.holofoil        ?? undefined,
      reverseHolofoil: c.tcgplayer?.prices?.reverseHolofoil ?? undefined,
    };

    await Card.findByIdAndUpdate(
      c.id,
      {
        _id:                    c.id,
        name:                   c.name,
        number:                 c.number,
        supertype:              c.supertype,
        subtypes:               c.subtypes ?? [],
        rarity:                 c.rarity ?? '',
        artist:                 c.artist ?? '',
        nationalPokedexNumbers: c.nationalPokedexNumbers ?? [],
        types:                  c.types ?? [],
        set:                    c.set,
        images:                 c.images,
        prices,
        lastPriceSyncAt: new Date(),
        syncedAt:        new Date(),
      },
      { upsert: true, new: true }
    );
  }

  console.log(`Sincronizadas ${cards.length} cartas (query: "${query}")`);
  return cards.length;
}

/** Busca cartas de destaque para a home */
export async function syncFeaturedCards(): Promise<void> {
  const queries = [
    'name:Charizard supertype:Pokémon',
    'name:Pikachu supertype:Pokémon',
    'name:Mewtwo supertype:Pokémon',
    'name:Eevee supertype:Pokémon',
  ];
  for (const q of queries) {
    await syncCards(q, 8);
  }
}

/** Busca carta por nome (pesquisa do usuário) */
export async function searchCardsByName(name: string, page = 1, pageSize = 20) {
  const response = await client.get<{ data: PokeTCGCard[]; totalCount: number }>(
    '/cards',
    { params: { q: `name:${name}*`, page, pageSize } }
  );
  return response.data;
}
