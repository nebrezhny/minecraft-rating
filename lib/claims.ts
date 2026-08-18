import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

type ClaimPayload = { address: string; key: string; expiresAt: number };

function getSecret() {
  const secret = process.env.CLAIM_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') throw new Error('Сервис подтверждения временно не настроен');
  return 'minecraft-rating-local-development-secret';
}

function sign(encodedPayload: string) {
  return createHmac('sha256', getSecret()).update(encodedPayload).digest('base64url');
}

export function createClaim(address: string) {
  const payload: ClaimPayload = {
    address,
    key: `MR-${randomBytes(3).toString('hex').toUpperCase()}`,
    expiresAt: Date.now() + 15 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { ...payload, challenge: `${encoded}.${sign(encoded)}` };
}

export function readClaim(challenge: string, address: string, key: string) {
  const [encoded, signature] = challenge.split('.');
  if (!encoded || !signature) throw new Error('Проверка повреждена. Получите новый ключ');
  const expected = Buffer.from(sign(encoded));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) throw new Error('Проверка недействительна. Получите новый ключ');
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as ClaimPayload;
  if (payload.expiresAt < Date.now()) throw new Error('Срок ключа истёк. Получите новый');
  if (payload.address !== address || payload.key !== key) throw new Error('Адрес или ключ были изменены');
  return payload;
}
