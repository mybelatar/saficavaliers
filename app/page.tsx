'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ROLE_STORAGE_KEY, isUserRole, type UserRole } from '../lib/roles';
import { BrandSignature } from './components/BrandSignature';

const ROLE_OPTIONS: Array<{
  role: UserRole;
  title: string;
  description: string;
  href: string;
  accentClassName: string;
  detail: string;
}> = [
  {
    role: 'SERVER',
    title: 'Serveur',
    description: 'Prise de commande',
    href: '/tablet',
    accentClassName: 'from-[#556843] via-[#6f7d4e] to-[#8ea06c]',
    detail: 'Salle, terrasse et service client'
  },
  {
    role: 'KITCHEN',
    title: 'Cuisine',
    description: 'Suivi cuisine',
    href: '/kitchen',
    accentClassName: 'from-[#5b3527] via-[#7a4833] to-[#9b6140]',
    detail: 'Poste cuisine et envoi'
  },
  {
    role: 'MANAGER',
    title: 'Manager',
    description: 'Pilotage global',
    href: '/manager',
    accentClassName: 'from-[#7a4a2e] via-[#ab6136] to-[#c97f45]',
    detail: 'Vision complete des operations'
  },
  {
    role: 'DISPLAY',
    title: 'Ecran client',
    description: 'Suivi client',
    href: '/display',
    accentClassName: 'from-[#39515b] via-[#4f6f79] to-[#7da4af]',
    detail: 'Suivi public en salle'
  }
];

export default function HomePage() {
  const router = useRouter();
  const [savedRole, setSavedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY);
    if (isUserRole(storedRole)) {
      setSavedRole(storedRole);
    }
  }, []);

  const savedRoleOption = useMemo(
    () => ROLE_OPTIONS.find((option) => option.role === savedRole),
    [savedRole]
  );

  const selectRole = (role: UserRole, href: string) => {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    router.push(href);
  };

  return (
    <main className="app-shell px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <section className="page-hero rounded-[1.6rem] p-4 sm:p-5 lg:p-6">
          <div className="relative z-10">
            <div className="space-y-3">
              <BrandSignature compact />
              <span className="section-kicker">Safi Cavaliers - Operations</span>
              <div className="space-y-2">
                <h1 className="font-display text-3xl leading-tight text-[var(--ink-950)] sm:text-4xl">
                  Tableau de pilotage
                </h1>
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--ink-700)]">Commandes, cuisine, stock</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="theme-chip">Multi-postes</span>
                <span className="theme-chip">Temps reel</span>
              </div>

              {savedRoleOption && (
                <button
                  onClick={() => selectRole(savedRoleOption.role, savedRoleOption.href)}
                  className="theme-action rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  Continuer avec le profil enregistre: {savedRoleOption.title}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ROLE_OPTIONS.map((option, index) => (
            <button
              key={option.role}
              onClick={() => selectRole(option.role, option.href)}
              className="theme-card group rounded-[1.4rem] p-4 text-left"
            >
              <div
                className={`mb-3 rounded-[1.1rem] bg-gradient-to-br ${option.accentClassName} p-3 text-white shadow-lg`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/80">0{index + 1}</p>
                    <h2 className="mt-1 font-display text-2xl text-white">{option.title}</h2>
                  </div>
                  <span className="rounded-full border border-white/20 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-white/80">
                    {option.detail}
                  </span>
                </div>
              </div>

              <p className="text-xs text-[var(--sand-200)]">{option.description}</p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-[var(--sand-400)]">Ouvrir {option.title.toLowerCase()}</span>
                <span className="text-[var(--clay-400)] group-hover:translate-x-1">Entrer</span>
              </div>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
