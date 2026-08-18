import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Minecraft Rating — мониторинг Minecraft-серверов',
  description: 'Живой рейтинг Minecraft-серверов: онлайн, режимы, версии и честные голоса.',
  applicationName: 'Minecraft Rating',
  icons: { icon: '/minecraft-rating-mark.png', apple: '/minecraft-rating-mark.png' },
};

export const viewport: Viewport = { themeColor: '#0b0d10', colorScheme: 'dark' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>;
}
