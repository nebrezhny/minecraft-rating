'use client';

import { RotateCcw } from 'lucide-react';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="system-page"><div className="system-brand">MINECRAFT <b>RATING</b></div><p className="system-code">Ошибка загрузки</p><h1>Список серверов временно недоступен</h1><p>Проверьте соединение и попробуйте получить данные ещё раз.</p><button onClick={reset}>Повторить <RotateCcw /></button></main>;
}
