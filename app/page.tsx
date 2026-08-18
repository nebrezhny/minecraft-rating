import CatalogClient from './ui/catalog-client';
import { getCatalogStats, getServers } from '../lib/servers';

export default async function Home() {
  const [servers, stats] = await Promise.all([getServers(), getCatalogStats()]);
  return <CatalogClient initialServers={servers} stats={stats} />;
}
