import { NextResponse } from 'next/server';
import { z } from 'zod';
import { readClaim } from '../../../../lib/claims';
import { verifyMotd } from '../../../../lib/minecraft';
import { checkRateLimit } from '../../../../lib/rate-limit';

export const runtime = 'nodejs';

const bodySchema = z.object({
  address: z.string().trim().min(3).max(260),
  key: z.string().regex(/^MR-[A-F0-9]{6}$/),
  challenge: z.string().min(20).max(1000),
});

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(request, 'claim-verify', 5);
    if (!rate.allowed) return NextResponse.json({ error: 'Слишком много проверок. Подождите минуту' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    const body = bodySchema.parse(await request.json());
    readClaim(body.challenge, body.address, body.key);
    const result = await verifyMotd(body.address, body.key);
    return NextResponse.json(result, { status: result.verified ? 200 : 409 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Сервер не ответил на проверку';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
