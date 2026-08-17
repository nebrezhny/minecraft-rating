import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Minecraft Rating — мониторинг Minecraft-серверов',
  description: 'Живой рейтинг Minecraft-серверов: онлайн, режимы, версии и честные голоса.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>;
}
