import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return <main className="system-page"><div className="system-brand">MINECRAFT <b>RATING</b></div><p className="system-code">404</p><h1>Такой страницы нет</h1><p>Вернитесь к рейтингу и выберите живой сервер.</p><Link href="/">К серверам <ArrowLeft /></Link></main>;
}
