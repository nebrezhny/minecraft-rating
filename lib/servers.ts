import 'server-only';
import { calculateScore, getEngagement, type Engagement } from './engagement';

export type Server = Engagement & {
  id: number;
  slug: string;
  name: string;
  ip: string;
  online: number;
  max: number;
  ping: number;
  version: string;
  tags: string[];
  mark: string;
  tone: string;
  desc: string;
  wipe: string;
  motd: [string, string];
  verified: boolean;
  suspicious: boolean;
  rating: number;
  score: number;
};

type SeedServer = Omit<Server, keyof Engagement | 'score'>;

const seedServers: SeedServer[] = [
  { id: 1, slug: 'holyworld', name: 'HolyWorld', ip: 'mc.holyworld.ru', online: 8421, max: 12000, ping: 42, version: '1.16–1.21', tags: ['Анархия', 'Java'], mark: 'HW', tone: '#c97042', desc: 'Кланы, ивенты и свобода действий', wipe: 'Вайп 2 дня назад', motd: ['HOLYWORLD', 'ЛЕТНИЙ СЕЗОН · /FREE'], verified: true, suspicious: false, rating: 9820 },
  { id: 2, slug: 'foxmine', name: 'FoxMine', ip: 'play.foxmine.net', online: 6190, max: 8000, ping: 38, version: '1.20.4', tags: ['Выживание', 'Без доната', 'Bedrock+Java'], mark: 'FM', tone: '#c4902f', desc: 'Честное выживание и кроссплей', wipe: 'Вайп сегодня', motd: ['FOX MINE', 'НОВЫЙ МИР УЖЕ ОТКРЫТ'], verified: true, suspicious: false, rating: 8640 },
  { id: 3, slug: 'reallyworld', name: 'ReallyWorld', ip: 'mc.reallyworld.ru', online: 4872, max: 10000, ping: 51, version: '1.16.5', tags: ['Анархия', 'PvP'], mark: 'RW', tone: '#7159c7', desc: 'Классическая анархия без лишних правил', wipe: 'Вайп 5 дней назад', motd: ['REALLYWORLD', 'ГЛОБАЛЬНОЕ ОБНОВЛЕНИЕ'], verified: false, suspicious: true, rating: 7480 },
  { id: 4, slug: 'vanilla-plus', name: 'Vanilla Plus', ip: 'vanilla.plus', online: 1248, max: 2000, ping: 29, version: '1.21', tags: ['Выживание', 'Без доната', 'Голосовой чат'], mark: 'V+', tone: '#3b9b72', desc: 'Новая ваниль с близким комьюнити', wipe: 'Без вайпов', motd: ['VANILLA+', 'ЧЕСТНАЯ ИГРА БЕЗ P2W'], verified: true, suspicious: false, rating: 6210 },
  { id: 5, slug: 'cubecraft-ru', name: 'CubeCraft RU', ip: 'ru.cubecraft.gg', online: 956, max: 3000, ping: 64, version: '1.19–1.21', tags: ['Мини-игры', 'Bedrock+Java'], mark: 'CC', tone: '#3976bd', desc: 'Быстрые мини-игры для компании', wipe: 'Вайп неделю назад', motd: ['CUBECRAFT', 'BEDWARS · SKYWARS · ARCADE'], verified: false, suspicious: false, rating: 5920 },
];

export type ServerQuery = { query?: string; tag?: string; sort?: 'rating' | 'online' };

export async function getServers({ query = '', tag = 'Все', sort = 'rating' }: ServerQuery = {}) {
  const needle = query.trim().toLocaleLowerCase('ru');
  return seedServers
    .map((server) => {
      const engagement = getEngagement(server.id);
      return { ...server, ...engagement, score: calculateScore(server.rating, engagement) };
    })
    .filter((server) => tag === 'Все' || server.tags.includes(tag))
    .filter((server) => !needle || `${server.name} ${server.ip} ${server.tags.join(' ')}`.toLocaleLowerCase('ru').includes(needle))
    .sort((a, b) => sort === 'online' ? b.online - a.online : b.score - a.score);
}

export async function getCatalogStats() {
  return {
    listed: 312,
    online: seedServers.reduce((total, server) => total + server.online, 0) + 16805,
    sources: 16,
    foundToday: 48,
  };
}
