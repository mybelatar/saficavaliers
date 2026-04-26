import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Safi Cavaliers',
    short_name: 'Safi Cavaliers',
    description: 'Gestion des commandes, cuisine, stock et caisse pour Safi Cavaliers.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    orientation: 'any',
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
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Safi Cavaliers'
      }
    ],
    shortcuts: [
      {
        name: 'Commandes serveurs',
        short_name: 'Serveur',
        description: 'Prendre et suivre les commandes des tables.',
        url: '/tablet',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Ecran cuisine',
        short_name: 'Cuisine',
        description: 'Voir et mettre a jour les commandes en cuisine.',
        url: '/kitchen',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      },
      {
        name: 'Dashboard manager',
        short_name: 'Manager',
        description: 'Suivre ventes, stock et reservations.',
        url: '/mobile',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }]
      }
    ]
  };
}
