import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Safi Cavaliers',
    short_name: 'Safi Cavaliers',
    description: 'Gestion des commandes, cuisine, stock et caisse pour Safi Cavaliers.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    orientation: 'portrait',
    background_color: '#140f0b',
    theme_color: '#8b5a36',
    lang: 'fr',
    categories: ['food', 'business', 'productivity'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    screenshots: [
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Safi Cavaliers'
      }
    ]
  };
}
