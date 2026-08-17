'use client';

import { useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, Bot, Check, CircleCheck, Copy, Database, Menu, Search, ShieldCheck, TriangleAlert, X } from 'lucide-react';

const servers = [
  { id: 1, name: 'HolyWorld', ip: 'mc.holyworld.ru', online: 8421, max: 12000, ping: 42, version: '1.16–1.21', tags: ['Анархия', 'Java'], mark: 'HW', tone: '#c97042', desc: 'Кланы, ивенты и свобода действий', wipe: 'Вайп 2 дня назад', motd: ['HOLYWORLD', ' ЛЕТНИЙ СЕЗОН · /FREE'], verified: true, suspicious: false },
  { id: 2, name: 'FoxMine', ip: 'play.foxmine.net', online: 6190, max: 8000, ping: 38, version: '1.20.4', tags: ['Выживание', 'Без доната', 'Bedrock+Java'], mark: 'FM', tone: '#c4902f', desc: 'Честное выживание и кроссплей', wipe: 'Вайп сегодня', motd: ['FOX MINE', ' НОВЫЙ МИР УЖЕ ОТКРЫТ'], verified: true, suspicious: false },
  { id: 3, name: 'ReallyWorld', ip: 'mc.reallyworld.ru', online: 4872, max: 10000, ping: 51, version: '1.16.5', tags: ['Анархия', 'PvP'], mark: 'RW', tone: '#7159c7', desc: 'Классическая анархия без лишних правил', wipe: 'Вайп 5 дней назад', motd: ['REALLYWORLD', ' ГЛОБАЛЬНОЕ ОБНОВЛЕНИЕ'], verified: false, suspicious: true },
  { id: 4, name: 'Vanilla Plus', ip: 'vanilla.plus', online: 1248, max: 2000, ping: 29, version: '1.21', tags: ['Выживание', 'Без доната', 'Голосовой чат'], mark: 'V+', tone: '#3b9b72', desc: 'Новая ваниль с близким комьюнити', wipe: 'Без вайпов', motd: ['VANILLA+', ' ЧЕСТНАЯ ИГРА БЕЗ P2W'], verified: true, suspicious: false },
  { id: 5, name: 'CubeCraft RU', ip: 'ru.cubecraft.gg', online: 956, max: 3000, ping: 64, version: '1.19–1.21', tags: ['Мини-игры', 'Bedrock+Java'], mark: 'CC', tone: '#3976bd', desc: 'Быстрые мини-игры для компании', wipe: 'Вайп неделю назад', motd: ['CUBECRAFT', ' BEDWARS · SKYWARS · ARCADE'], verified: false, suspicious: false },
];

const filters = ['Все', 'Анархия', 'Выживание', 'Без доната', 'Голосовой чат', 'Bedrock+Java'];

function ServerRow({ server, rank, onClaim }: { server: typeof servers[number]; rank: number; onClaim: () => void }) {
  const [copied, setCopied] = useState(false);
  const fill = Math.round((server.online / server.max) * 100);
  const copy = async () => {
    await navigator.clipboard?.writeText(server.ip);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return <article className="server-row">
    <span className="rank">{String(rank).padStart(2, '0')}</span>
    <div className="server-main">
      <span className="avatar" style={{ '--tone': server.tone } as React.CSSProperties}>{server.mark}</span>
      <div className="server-copy">
        <div className="name-line"><h3>{server.name}</h3>{server.verified && <BadgeCheck aria-label="Владелец подтверждён" />}{server.suspicious && <span className="risk"><TriangleAlert /> накрутка?</span>}</div>
        <p>{server.desc}</p>
        <div className="tags"><Bot aria-label="Теги назначены автоматически" />{server.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
      </div>
    </div>
    <div className="motd-banner" style={{ '--motd-tone': server.tone } as React.CSSProperties}>
      <span>{server.motd[0]}</span><small>{server.motd[1]}</small>
    </div>
    <div className="online-cell">
      <div><i /> <strong>{server.online.toLocaleString('ru-RU')}</strong><span> / {server.max.toLocaleString('ru-RU')}</span></div>
      <div className="meter"><i style={{ width: `${fill}%` }} /></div>
      <small>{server.version} · {server.ping} мс · {server.wipe}</small>
    </div>
    <button className={`copy-button ${copied ? 'copied' : ''}`} onClick={copy}>
      <span><small>{copied ? 'ГОТОВО' : 'IP СЕРВЕРА'}</small>{copied ? 'Скопировано' : server.ip}</span>
      {copied ? <Check /> : <Copy />}
    </button>
    {!server.verified && <button className="claim-row" onClick={onClaim}>Это ваш сервер?</button>}
  </article>;
}

function ClaimDialog({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const key = 'MR-7K4P-92NX';
  const copyKey = async () => { await navigator.clipboard?.writeText(key); setCopied(true); };
  return <div className="dialog-backdrop" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="claim-dialog" role="dialog" aria-modal="true" aria-labelledby="claim-title">
      <button className="dialog-close" onClick={onClose} aria-label="Закрыть"><X /></button>
      <div className="dialog-icon"><ShieldCheck /></div>
      <p className="dialog-step">Подтверждение владельца</p>
      <h2 id="claim-title">Заберите сервер себе</h2>
      <p className="dialog-copy">Добавьте ключ в MOTD и запустите проверку. После успешного пинга сервер появится в вашем профиле.</p>
      <label className="dialog-field"><span>Адрес сервера</span><input defaultValue="play.example.ru" /></label>
      <div className="verification-key"><div><span>Ключ для MOTD</span><strong>{key}</strong></div><button onClick={copyKey}>{copied ? <Check /> : <Copy />}{copied ? 'Скопирован' : 'Копировать'}</button></div>
      <div className="dialog-hint"><CircleCheck /> Ключ можно удалить сразу после подтверждения.</div>
      <button className="verify-button">Проверить MOTD <ArrowRight /></button>
    </section>
  </div>;
}

export default function Home() {
  const [filter, setFilter] = useState('Все');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'rating' | 'online'>('rating');
  const [menu, setMenu] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const visible = useMemo(() => servers.filter(server =>
    (filter === 'Все' || server.tags.includes(filter)) &&
    `${server.name} ${server.ip} ${server.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())
  ).sort((a, b) => sort === 'online' ? b.online - a.online : a.id - b.id), [filter, query, sort]);

  return <main>
    <header className="site-header">
      <a className="brand" href="#top"><img src="/minecraft-rating-mark.png" alt="" /><span>MINECRAFT <b>RATING</b></span></a>
      <nav className={menu ? 'open' : ''}><a href="#rating" aria-current="page">Серверы</a><a href="#rating">Новые</a><a href="#rating">Отзывы</a><a href="#owners">Владельцам</a></nav>
      <div className="header-actions"><button className="sign-in">Войти</button><button className="add-server" onClick={() => setClaimOpen(true)}>Забрать сервер <ArrowRight /></button><button className="menu-button" aria-label="Меню" onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></div>
    </header>

    <section className="intro" id="top">
      <div><p className="eyebrow"><i /> обновлено 34 сек. назад</p><h1>Серверы Minecraft</h1><p className="intro-note">Найди сервер по режиму, версии и реальному онлайну.</p></div>
      <div className="catalog-stats"><span><strong>312</strong> серверов</span><span><strong>38 492</strong> игрока онлайн</span><span><strong>24/7</strong> мониторинг</span></div>
    </section>

    <section className="source-strip" aria-label="Статус автоматического мониторинга"><span><Database /> 16 источников</span><span><i /> 48 серверов найдено сегодня</span><span><Bot /> Автотеги обновлены 6 мин. назад</span><button onClick={() => setClaimOpen(true)}>Уже нашли ваш сервер? Забрать</button></section>

    <section className="rating" id="rating">
      <div className="command-bar">
        <label><Search /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Название, IP или режим игры" /><kbd>⌘ K</kbd></label>
        <div className="sort-control"><span>Сортировка</span><button className={sort === 'rating' ? 'active' : ''} onClick={() => setSort('rating')}>По рейтингу</button><button className={sort === 'online' ? 'active' : ''} onClick={() => setSort('online')}>По онлайну</button></div>
      </div>
      <div className="popular"><span>Часто ищут:</span>{['Анархия', 'Без доната', 'Голосовой чат', 'Bedrock+Java'].map(item => <button key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <div className="filter-row">{filters.map(item => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'active' : ''}>{item}</button>)}</div>
      <div className="table-head"><span>Место / сервер</span><span>MOTD</span><span>Онлайн</span><span>Подключение</span></div>
      <div className="server-list">{visible.length ? visible.map((server, index) => <ServerRow key={server.id} server={server} rank={index + 1} onClaim={() => setClaimOpen(true)} />) : <div className="empty"><Search /><h3>Ничего не нашли</h3><p>Попробуй другой режим или сбрось фильтры.</p><button onClick={() => { setFilter('Все'); setQuery(''); }}>Сбросить</button></div>}</div>
      <button className="more">Показать ещё 24 сервера <ArrowRight /></button>
    </section>

    <footer id="owners"><a className="brand" href="#top"><img src="/minecraft-rating-mark.png" alt="" /><span>MINECRAFT <b>RATING</b></span></a><p>Серверы добавляются автоматически. Владение подтверждается через MOTD.</p><span>© 2026</span></footer>
    {claimOpen && <ClaimDialog onClose={() => setClaimOpen(false)} />}
  </main>;
}
