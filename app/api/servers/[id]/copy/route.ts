import { NextResponse } from 'next/server';
import { z } from 'zod';
import { recordCopy } from '../../../../../lib/engagement';

const bodySchema = z.object({ clientId: z.string().min(12).max(80) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const serverId = z.coerce.number().int().positive().parse(id);
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Некорректный идентификатор клиента' }, { status: 400 });
  return NextResponse.json(recordCopy(serverId, parsed.data.clientId), { headers: { 'Cache-Control': 'no-store' } });
}
