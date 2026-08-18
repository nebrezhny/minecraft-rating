import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCatalogStats, getServers } from '../../../lib/servers';

const querySchema = z.object({
  q: z.string().max(80).catch(''),
  tag: z.string().max(40).catch('Все'),
  sort: z.enum(['rating', 'online']).catch('rating'),
});

export async function GET(request: NextRequest) {
  const params = querySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const [servers, stats] = await Promise.all([
    getServers({ query: params.q, tag: params.tag, sort: params.sort }),
    getCatalogStats(),
  ]);
  return NextResponse.json({ servers, stats }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } });
}
