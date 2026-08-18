import { describe, expect, it } from 'vitest';
import { parseServerAddress } from './minecraft';

describe('Minecraft address parser', () => {
  it('parses hostnames and optional ports', () => {
    expect(parseServerAddress('Play.Example.RU')).toEqual({ host: 'play.example.ru', port: 25565 });
    expect(parseServerAddress('play.example.ru:19132')).toEqual({ host: 'play.example.ru', port: 19132 });
  });
  it('rejects malformed hosts and ports', () => {
    expect(() => parseServerAddress('https://example.ru')).toThrow();
    expect(() => parseServerAddress('example.ru:99999')).toThrow();
    expect(() => parseServerAddress('')).toThrow();
  });
});
