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
    description: 'Prendre les commandes, gerer les tables et suivre les notifications de service.',
    href: '/tablet',
    accentClassName: 'from-[#556843] via-[#6f7d4e] to-[#8ea06c]',
    detail: 'Salle, terrasse et service client'
  },
  {
    role: 'KITCHEN',
    title: 'Cuisine',
    description: 'Voir les commandes en direct, lancer la preparation et signaler les plats prets.',
    href: '/kitchen',
    accentClassName: 'from-[#5b3527] via-[#7a4833] to-[#9b6140]',
    detail: 'Poste cuisine et envoi'
  },
  {
    role: 'MANAGER',
    title: 'Manager',
    description: 'Piloter les ventes, la carte, le stock, les paiements et la gestion globale.',
    href: '/manager',
    accentClassName: 'from-[#7a4a2e] via-[#ab6136] to-[#c97f45]',
    detail: 'Vision complete du riad-restaurant'
  },
  {
    role: 'DISPLAY',
    title: 'Ecran client',
    description: 'Afficher les commandes sur grand ecran avec leur progression, de la reception au service.',
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
    <main className="app-shell px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="page-hero rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.45fr_0.95fr] lg:items-center">
            <div className="space-y-6">
              <BrandSignature subtitle="Logo cheval, artisanat marocain et esprit riad ferme" />
              <span className="section-kicker">Safi Cavaliers - Riad ferme - Artisanat marocain</span>
              <div className="space-y-4">
                <h1 className="section-title hero-title-light">
                  Une plateforme de restaurant inspiree par le cheval, la terre et la tradition marocaine.
                </h1>
                <p className="section-subtitle hero-copy-light text-sm sm:text-base">
                  Le design prend maintenant une direction plus chaude et plus noble: ambiance riad-ferme,
                  artisanat, fantazia marocaine, nature, chevaux et service professionnel sur tablette.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <span className="theme-chip">Service salle et terrasse</span>
                <span className="theme-chip">Cuisine en temps reel</span>
                <span className="theme-chip">Gestion manager et stock</span>
              </div>

              {savedRoleOption && (
                <button
                  onClick={() => selectRole(savedRoleOption.role, savedRoleOption.href)}
                  className="theme-action rounded-2xl px-5 py-3 text-sm font-semibold"
                >
                  Continuer avec le profil enregistre: {savedRoleOption.title}
                </button>
              )}
            </div>

            <div className="theme-card-soft rounded-[2rem] p-6 sm:p-7">
              <div className="space-y-5">
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--ink-700)]">Maison</p>
                <div className="max-w-xs">
                  <BrandSignature compact />
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm text-[var(--sand-200)]">
                <p>
                  Identite visee: terre cuite, bois sombre, zellige discret, olivier, lumiere chaude et
                  presence equestre elegante.
                </p>
                <p>
                  Objectif: garder une interface rapide pour le personnel, tout en donnant une impression plus
                  premium et plus ancree dans l'univers du lieu.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {ROLE_OPTIONS.map((option, index) => (
            <button
              key={option.role}
              onClick={() => selectRole(option.role, option.href)}
              className="theme-card group rounded-[2rem] p-5 text-left"
            >
              <div
                className={`mb-5 rounded-[1.5rem] bg-gradient-to-br ${option.accentClassName} p-4 text-white shadow-lg`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/80">0{index + 1}</p>
                    <h2 className="mt-2 font-display text-3xl text-white">{option.title}</h2>
                  </div>
                  <span className="rounded-full border border-white/20 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/80">
                    {option.detail}
                  </span>
                </div>
              </div>

              <p className="text-sm leading-7 text-[var(--sand-200)]">{option.description}</p>
              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-[var(--sand-400)]">Ouvrir l'espace {option.title.toLowerCase()}</span>
                <span className="text-[var(--clay-400)] group-hover:translate-x-1">Entrer</span>
              </div>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}
