import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Role0',
    short_name: 'Role0',
    description: 'Menos solidão, mais rolê',
    start_url: '/home',
    display: 'standalone',
    background_color: '#0B0B0F',
    theme_color: '#e03800',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon?size=192',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon?size=512',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon?size=512&maskable=true',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      }
    ],
  };
}
