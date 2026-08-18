import 'server-only';

import { isIP } from 'node:net';
import { lookup as resolveHost } from 'node:dns/promises';
import { pingJava } from '@minescope/mineping';

export type ParsedAddress = { host: string; port: number };

export function parseServerAddress(value: string): ParsedAddress {
  const clean = value.trim().toLowerCase().replace(/^minecraft:\/\//, '');
  const [host, portValue] = clean.split(':');
  const port = portValue ? Number(portValue) : 25565;
  if (!host || host.length > 253 || !/^[a-z0-9.-]+$/.test(host) || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Укажите корректный адрес сервера');
  }
  return { host, port };
}

function isPrivateAddress(address: string) {
  if (address === '::1' || address.startsWith('fc') || address.startsWith('fd') || address.startsWith('fe80:')) return true;
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  return false;
}

export async function verifyMotd(address: string, key: string) {
  const { host, port } = parseServerAddress(address);
  const resolved = await resolveHost(host, { all: true });
  if (!resolved.length || resolved.some((item) => isPrivateAddress(item.address))) {
    throw new Error('Локальные и служебные адреса нельзя проверять');
  }

  const startedAt = performance.now();
  const result = await pingJava(resolved[0].address, { port, timeout: 4500, protocolVersion: -1 });
  const latency = Math.round(performance.now() - startedAt);
  const raw = typeof result.description === 'string' ? result.description : JSON.stringify(result.description ?? '');
  return {
    verified: raw.toLocaleLowerCase('ru').includes(key.toLocaleLowerCase('ru')),
    latency,
  };
}
