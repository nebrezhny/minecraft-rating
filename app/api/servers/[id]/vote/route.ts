import { NextResponse } from 'next/server';
import { z } from 'zod';
import { recordVote } from '../../../../../lib/engagement';

const bodySchema = z.object({ clientId: z.string().min(12).max(80) });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const serverId = z.coerce.number().int().positive().parse(id);
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'Некорректный идентификатор клиента' }, { status: 400 });
  const result = recordVote(serverId, parsed.data.clientId);
  return NextResponse.json(result, { status: result.accepted ? 200 : 409, headers: { 'Cache-Control': 'no-store' } });
}
