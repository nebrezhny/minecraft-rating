import { describe, expect, it } from 'vitest';
import { createClaim, readClaim } from './claims';

describe('MOTD claim challenge', () => {
  it('creates a signed challenge bound to address and key', () => {
    const claim = createClaim('play.example.ru');
    expect(claim.key).toMatch(/^MR-[A-F0-9]{6}$/);
    expect(readClaim(claim.challenge, 'play.example.ru', claim.key)).toMatchObject({ address: 'play.example.ru', key: claim.key });
  });
  it('rejects a changed address, key, or signature', () => {
    const claim = createClaim('play.example.ru');
    expect(() => readClaim(claim.challenge, 'evil.example.ru', claim.key)).toThrow();
    expect(() => readClaim(`${claim.challenge}x`, 'play.example.ru', claim.key)).toThrow();
  });
});
