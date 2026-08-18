'use client';

/* The compact local brand mark is intentionally served without runtime image transforms. */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, Bot, Check, ChevronUp, CircleCheck, Copy, Database, LoaderCircle, Menu, Search, ShieldCheck, TriangleAlert, X } from 'lucide-react';

type Server = { id: number; slug: string; name: string; ip: string; online: number; max: number; ping: number; version: string; tags: string[]; mark: string; tone: string; desc: string; wipe: string; motd: [string, string]; verified: boolean; suspicious: boolean; rating: number; score: number; copiesToday: number; copiesMonth: number; votesToday: number; votesMonth: number };
type Stats = { listed: number; online: number; sources: number; foundToday: number };
const filters = ['Все', 'Анархия', 'Выживание', 'Без доната', 'Голосовой чат', 'Bedrock+Java'];

function getClientId() {
  const stored = window.localStorage.getItem('mr-client-id');
  if (stored) return stored;
  const id = crypto.randomUUID();
  window.localStorage.setItem('mr-client-id', id);
  return id;
}

function calculateClientScore(server: Server) {
  return Math.round(server.rating + server.votesMonth * 4 + server.votesToday * 18 + server.copiesMonth * 0.08);
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
}

function ServerRow({ server, rank, onClaim, onUpdate }: { server: Server; rank: number; onClaim: (ip: string) => void; onUpdate: (server: Server) => void }) {
  const [copied, setCopied] = useState(false);
  const [voted, setVoted] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false);
  const fill = Math.min(100, Math.round((server.online / server.max) * 100));
  const copy = async () => {
    await copyText(server.ip);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
    try {
      const response = await fetch(`/api/servers/${server.id}/copy`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: getClientId() }) });
      if (response.ok) onUpdate({ ...server, ...await response.json() });
    } catch { /* Копирование уже сработало — метрика не должна мешать игроку. */ }
  };
  const vote = async () => {
    setVoteBusy(true);
    try {
      const response = await fetch(`/api/servers/${server.id}/vote`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: getClientId() }) });
      const data = await response.json();
      const next = { ...server, ...data.metrics };
      next.score = calculateClientScore(next);
      onUpdate(next);
      setVoted(true);
    } finally { setVoteBusy(false); }
  };
  return <article className="server-row">
    <span className="rank">{String(rank).padStart(2, '0')}</span>
    <div className="server-main"><span className="avatar" style={{ '--tone': server.tone } as React.CSSProperties}>{server.mark}</span><div className="server-copy">
      <div className="name-line"><h2>{server.name}</h2>{server.verified && <BadgeCheck aria-label="Владелец подтверждён" />}{server.suspicious && <span className="risk"><TriangleAlert aria-hidden="true" /> подозрительный онлайн</span>}</div>
      <p>{server.desc}</p><div className="tags"><Bot aria-label="Теги назначены автоматически" />{server.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
    </div></div>
    <div className="motd-banner" style={{ '--motd-tone': server.tone } as React.CSSProperties}><span>{server.motd[0]}</span><small>{server.motd[1]}</small></div>
    <div className="online-cell"><div><i aria-hidden="true" /> <strong>{server.online.toLocaleString('ru-RU')}</strong><span> / {server.max.toLocaleString('ru-RU')}</span></div><div className="meter" aria-label={`Заполнено на ${fill}%`}><i style={{ width: `${fill}%` }} /></div><small>{server.version} · {server.ping} мс · {server.wipe}</small></div>
    <div className="server-actions"><div className="engagement-line"><button className={`vote-button ${voted ? 'voted' : ''}`} disabled={voteBusy || voted} onClick={vote} aria-label={`Проголосовать за ${server.name}`}><ChevronUp aria-hidden="true" /><span><strong>{server.votesMonth.toLocaleString('ru-RU')}</strong><small>{voted ? 'Голос учтён' : 'Голосовать'}</small></span></button><span className="copy-stats"><strong>{server.copiesToday}</strong> сегодня<small>{server.copiesMonth.toLocaleString('ru-RU')} за месяц</small></span></div><button className={`copy-button ${copied ? 'copied' : ''}`} onClick={copy} aria-live="polite"><span><small>{copied ? 'ГОТОВО' : 'IP СЕРВЕРА'}</small>{copied ? 'Скопировано' : server.ip}</span>{copied ? <Check /> : <Copy />}</button></div>
    {!server.verified && <button className="claim-row" onClick={() => onClaim(server.ip)}>Это ваш сервер?</button>}
  </article>;
}

function ClaimDialog({ initialAddress, onClose }: { initialAddress: string; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [address, setAddress] = useState(initialAddress);
  const [key, setKey] = useState('');
  const [challenge, setChallenge] = useState('');
  const [phase, setPhase] = useState<'idle' | 'creating' | 'ready' | 'verifying' | 'success'>('idle');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const requestController = useRef<AbortController | null>(null);
  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const dialog = closeRef.current?.closest('[role="dialog"]');
        const controls = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)')) : [];
        if (!controls.length) return;
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKeyDown); document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = ''; requestController.current?.abort(); previouslyFocused?.focus(); };
  }, [onClose]);
  const request = async (url: string, body: object) => {
    requestController.current?.abort();
    const controller = new AbortController(); requestController.current = controller;
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? 'Не удалось выполнить запрос');
    return data;
  };
  const createChallenge = async () => { try { setPhase('creating'); setError(''); const data = await request('/api/claims', { address }); setKey(data.key); setChallenge(data.challenge); setCopied(false); setPhase('ready'); } catch (reason) { if ((reason as Error)?.name === 'AbortError') return; setError(reason instanceof Error ? reason.message : 'Не удалось создать ключ'); setPhase('idle'); } };
  const verify = async () => { try { setPhase('verifying'); setError(''); await request('/api/claims/verify', { address, key, challenge }); setPhase('success'); } catch (reason) { if ((reason as Error)?.name === 'AbortError') return; setError(reason instanceof Error ? reason.message : 'Ключ пока не найден в MOTD'); setPhase('ready'); } };
  const copyKey = async () => { await navigator.clipboard.writeText(key); setCopied(true); };
  const busy = phase === 'creating' || phase === 'verifying';
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="claim-dialog" role="dialog" aria-modal="true" aria-labelledby="claim-title" aria-describedby="claim-copy">
    <button ref={closeRef} className="dialog-close" onClick={onClose} aria-label="Закрыть"><X /></button><div className="dialog-icon">{phase === 'success' ? <CircleCheck /> : <ShieldCheck />}</div><p className="dialog-step">Подтверждение владельца</p>
    <h2 id="claim-title">{phase === 'success' ? 'Сервер подтверждён' : 'Заберите сервер себе'}</h2><p className="dialog-copy" id="claim-copy">{phase === 'success' ? 'Права владельца подтверждены. Сервер готов к привязке к аккаунту.' : 'Получите ключ, добавьте его в MOTD и запустите проверку.'}</p>
    {phase !== 'success' && <><label className="dialog-field"><span>Адрес сервера</span><input name="server-address" autoComplete="off" value={address} onChange={(event) => { setAddress(event.target.value); setKey(''); setChallenge(''); setError(''); setPhase('idle'); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'claim-error' : undefined} placeholder="play.example.ru:25565" /></label>
      {key && <div className="verification-key"><div><span>Добавьте в MOTD на 15 минут</span><strong>{key}</strong></div><button onClick={copyKey}>{copied ? <Check /> : <Copy />}{copied ? 'Скопирован' : 'Копировать'}</button></div>}{key && <div className="dialog-hint"><CircleCheck /> Ключ можно удалить после подтверждения.</div>}{error && <p className="dialog-error" id="claim-error" role="alert">{error}</p>}
      <button className="verify-button" disabled={busy || !address.trim()} onClick={key ? verify : createChallenge}>{phase === 'creating' ? 'Создаём ключ' : phase === 'verifying' ? 'Пингуем сервер' : key ? 'Проверить MOTD' : 'Получить ключ'}{busy ? <LoaderCircle className="spin" /> : <ArrowRight />}</button></>}
    {phase === 'success' && <button className="verify-button" onClick={onClose}>Готово <Check /></button>}
  </section></div>;
}

export default function CatalogClient({ initialServers, stats }: { initialServers: Server[]; stats: Stats }) {
  const [servers, setServers] = useState(initialServers); const [filter, setFilter] = useState('Все'); const [query, setQuery] = useState(''); const [sort, setSort] = useState<'rating' | 'online' | 'votes'>('rating'); const [menu, setMenu] = useState(false); const [claimAddress, setClaimAddress] = useState<string | null>(null); const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => { const shortcut = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); } }; document.addEventListener('keydown', shortcut); return () => document.removeEventListener('keydown', shortcut); }, []);
  const visible = useMemo(() => servers.filter((server) => (filter === 'Все' || server.tags.includes(filter)) && `${server.name} ${server.ip} ${server.tags.join(' ')}`.toLocaleLowerCase('ru').includes(query.trim().toLocaleLowerCase('ru'))).sort((a, b) => sort === 'online' ? b.online - a.online : sort === 'votes' ? b.votesMonth - a.votesMonth : b.score - a.score), [servers, filter, query, sort]);
  const reset = () => { setFilter('Все'); setQuery(''); setSort('rating'); };
  const updateServer = useCallback((updated: Server) => setServers((current) => current.map((server) => server.id === updated.id ? updated : server)), []);
  const closeClaim = useCallback(() => setClaimAddress(null), []);
  return <main><a className="skip-link" href="#rating">К списку серверов</a><header className="site-header"><a className="brand" href="#top" aria-label="Minecraft Rating — на главную"><img src="/minecraft-rating-lockup-cropped.png" alt="Minecraft Rating" /></a><nav className={menu ? 'open' : ''} aria-label="Основная навигация"><a href="#rating" aria-current="page">Серверы</a><a href="#rating" onClick={() => setSort('votes')}>По голосам</a><a href="#rating">Новые</a><a href="#rating">Отзывы</a><a href="#owners">Владельцам</a></nav><div className="header-actions"><button className="sign-in">Войти</button><button className="add-server" onClick={() => setClaimAddress('')}>Забрать сервер <ArrowRight /></button><button className="menu-button" aria-label="Меню" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X /> : <Menu />}</button></div></header>
    <section className="intro" id="top"><div><p className="eyebrow"><i /> обновлено 34 сек. назад</p><h1>Серверы Minecraft</h1><p className="intro-note">Найди сервер по режиму, версии и реальному онлайну.</p></div><div className="catalog-stats"><span><strong>{stats.listed}</strong> серверов</span><span><strong>{stats.online.toLocaleString('ru-RU')}</strong> игроков онлайн</span><span><strong>24/7</strong> мониторинг</span></div></section>
    <section className="source-strip" aria-label="Статус автоматического мониторинга"><span><Database /> {stats.sources} источников</span><span><i /> {stats.foundToday} серверов найдено сегодня</span><span><Bot /> Автотеги обновлены 6 мин. назад</span><button onClick={() => setClaimAddress('')}>Уже нашли ваш сервер? Забрать</button></section>
    <section className="rating" id="rating"><div className="command-bar"><label htmlFor="server-search"><Search /><input ref={searchRef} id="server-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название, IP или режим игры" /><kbd>Ctrl K</kbd></label><div className="sort-control"><span>Сортировка</span><button className={sort === 'rating' ? 'active' : ''} onClick={() => setSort('rating')}>По рейтингу</button><button className={sort === 'votes' ? 'active' : ''} onClick={() => setSort('votes')}>По голосам</button><button className={sort === 'online' ? 'active' : ''} onClick={() => setSort('online')}>По онлайну</button></div></div>
      <div className="popular"><span>Часто ищут:</span>{['Анархия', 'Без доната', 'Голосовой чат', 'Bedrock+Java'].map((item) => <button key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><div className="filter-row" aria-label="Фильтры серверов">{filters.map((item) => <button key={item} onClick={() => setFilter(item)} className={filter === item ? 'active' : ''} aria-pressed={filter === item}>{item}</button>)}</div><div className="results-meta"><span>Найдено: <strong>{visible.length}</strong></span>{(filter !== 'Все' || query || sort !== 'rating') && <button onClick={reset}>Сбросить всё</button>}</div>
      <div className="table-head"><span>Место / сервер</span><span>MOTD</span><span>Онлайн</span><span>Голоса / подключение</span></div><div className="server-list" aria-live="polite">{visible.length ? visible.map((server, index) => <ServerRow key={server.id} server={server} rank={index + 1} onClaim={setClaimAddress} onUpdate={updateServer} />) : <div className="empty"><Search /><h2>Ничего не нашли</h2><p>Попробуйте другой режим или сбросьте фильтры.</p><button onClick={reset}>Сбросить</button></div>}</div><button className="more">Показать ещё 24 сервера <ArrowRight /></button></section>
    <footer id="owners"><a className="brand" href="#top" aria-label="Minecraft Rating — на главную"><img src="/minecraft-rating-lockup-cropped.png" alt="Minecraft Rating" /></a><p>Серверы добавляются автоматически. Владение подтверждается через MOTD.</p><span>© 2026</span></footer>{claimAddress !== null && <ClaimDialog initialAddress={claimAddress} onClose={closeClaim} />}</main>;
}
