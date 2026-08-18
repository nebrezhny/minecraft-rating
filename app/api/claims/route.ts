import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClaim } from '../../../lib/claims';
import { parseServerAddress } from '../../../lib/minecraft';
import { checkRateLimit } from '../../../lib/rate-limit';

const bodySchema = z.object({ address: z.string().trim().min(3).max(260) });

export async function POST(request: Request) {
  try {
    const rate = checkRateLimit(request, 'claim-create');
    if (!rate.allowed) return NextResponse.json({ error: 'Слишком много попыток. Подождите минуту' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } });
    const body = bodySchema.parse(await request.json());
    parseServerAddress(body.address);
    const claim = createClaim(body.address);
    return NextResponse.json({ key: claim.key, challenge: claim.challenge, expiresAt: claim.expiresAt }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось создать проверку';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
