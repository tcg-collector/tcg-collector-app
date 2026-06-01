import axios from 'axios';
import { Card } from '../models/Card';

const BASE_URL = 'https://api.pokemontcg.io/v2';

const apiKey = process.env.POKEMONTCG_API_KEY;
const validKey = apiKey && apiKey !== 'sua_chave_aqui' ? apiKey : undefined;

const client = axios.create({
  baseURL: BASE_URL,
  headers: validKey ? { 'X-Api-Key': validKey } : {},
  timeout: 60000,
});

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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

function mapCard(c: PokeTCGCard) {
  return {
    _id: c.id,
    name: c.name,
    number: c.number,
    supertype: c.supertype,
    subtypes: c.subtypes ?? [],
    rarity: c.rarity ?? '',
    artist: c.artist ?? '',
    nationalPokedexNumbers: c.nationalPokedexNumbers ?? [],
    types: c.types ?? [],
    set: c.set,
    images: c.images,
    prices: {
      normal:          c.tcgplayer?.prices?.normal          ?? undefined,
      holofoil:        c.tcgplayer?.prices?.holofoil        ?? undefined,
      reverseHolofoil: c.tcgplayer?.prices?.reverseHolofoil ?? undefined,
    },
    lastPriceSyncAt: new Date(),
    syncedAt: new Date(),
  };
}

/** Sincroniza TODAS as cartas da PokéTCG API (paginado, ~18k cartas) */
export async function syncAllCards(startPage = 1): Promise<number> {
  let page = startPage;
  const pageSize = 250;
  let total = 0;
  const MAX_RETRIES = 3;

  console.log(`🔄 Iniciando sync completo de cartas (a partir da página ${startPage})...`);

  while (true) {
    let response;
    let retries = 0;
    while (retries < MAX_RETRIES) {
      try {
        response = await client.get<{ data: PokeTCGCard[]; totalCount: number }>(
          '/cards',
          { params: { pageSize, page, orderBy: '-set.releaseDate' } }
        );
        break; // sucesso
      } catch (e) {
        retries++;
        if (retries >= MAX_RETRIES) {
          console.error(`❌ Erro na página ${page} após ${MAX_RETRIES} tentativas:`, (e as Error).message);
          console.log(`⏭️  Para continuar, rode novamente com startPage=${page}`);
          console.log(`✅ Sync parcial: ${total} cartas salvas`);
          return total;
        }
        console.warn(`⚠️  Timeout na página ${page}, tentativa ${retries}/${MAX_RETRIES}. Aguardando 5s...`);
        await sleep(5000);
      }
    }
    if (!response) break;

    const cards = response.data.data;
    if (!cards.length) break;

    const operations = cards.map(c => ({
      updateOne: {
        filter: { _id: c.id },
        update: { $set: mapCard(c) },
        upsert: true,
      }
    }));

    await Card.bulkWrite(operations, { ordered: false });
    total += cards.length;
    console.log(`   📦 Página ${page}: +${cards.length} cartas (total: ${total})`);

    if (cards.length < pageSize) break;
    page++;
    await sleep(150); // respeita rate limit da API
  }

  console.log(`✅ Sync completo: ${total} cartas no banco`);
  return total;
}

/** Atualiza apenas os preços das cartas já existentes no banco */
export async function syncPricesOnly(): Promise<number> {
  let page = 1;
  const pageSize = 250;
  let total = 0;

  console.log('💰 Iniciando sync de preços...');

  while (true) {
    let response;
    try {
      response = await client.get<{ data: PokeTCGCard[]; totalCount: number }>(
        '/cards',
        { params: { pageSize, page, orderBy: '-set.releaseDate' } }
      );
    } catch (e) {
      console.error(`❌ Erro na página ${page}:`, e);
      break;
    }

    const cards = response.data.data;
    if (!cards.length) break;

    const operations = cards
      .filter(c => c.tcgplayer?.prices)
      .map(c => ({
        updateOne: {
          filter: { _id: c.id },
          update: {
            $set: {
              prices: {
                normal:          c.tcgplayer?.prices?.normal          ?? undefined,
                holofoil:        c.tcgplayer?.prices?.holofoil        ?? undefined,
                reverseHolofoil: c.tcgplayer?.prices?.reverseHolofoil ?? undefined,
              },
              lastPriceSyncAt: new Date(),
            }
          },
        }
      }));

    if (operations.length) {
      await Card.bulkWrite(operations, { ordered: false });
      total += operations.length;
    }

    if (cards.length < pageSize) break;
    page++;
    await sleep(150);
  }

  console.log(`✅ Preços atualizados: ${total} cartas`);
  return total;
}

/** Sync inicial de cartas destaque (seed rápido) */
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

/** Busca cartas por query arbitrária */
export async function syncCards(query: string, pageSize = 20): Promise<number> {
  const response = await client.get<{ data: PokeTCGCard[]; totalCount: number }>(
    '/cards',
    { params: { q: query, pageSize, orderBy: '-set.releaseDate' } }
  );

  const cards = response.data.data;
  const operations = cards.map(c => ({
    updateOne: {
      filter: { _id: c.id },
      update: { $set: mapCard(c) },
      upsert: true,
    }
  }));

  if (operations.length) {
    await Card.bulkWrite(operations, { ordered: false });
  }

  console.log(`Sincronizadas ${cards.length} cartas (query: "${query}")`);
  return cards.length;
}
