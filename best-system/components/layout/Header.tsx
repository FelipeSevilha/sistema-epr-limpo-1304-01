'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Search,
  Settings,
  SunMedium,
  MoonStar,
  Sparkles,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';

const pageLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/financeiro': 'Financeiro',
  '/orcamentos': 'Orçamentos',
  '/produtos': 'Produtos',
  '/pedidos': 'Pedidos',
  '/clientes': 'Clientes',
  '/comissoes': 'Comissões',
  '/metas': 'Metas',
  '/estoque': 'Estoque',
  '/painel-estrategico': 'Painel Estratégico',
  '/usuarios': 'Usuários',
  '/producao': 'Produção',
  '/ficha-tecnica': 'Ficha Técnica',
  '/compras': 'Compras',
};

export default function Header() {
  const pathname = usePathname();
  const label = pageLabels[pathname] ?? 'ERP';
  const [showSearch, setShowSearch] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const { user } = useAuth();

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'GS';

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');

    if (storedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
      return;
    }

    document.documentElement.classList.add('dark');
    setIsDark(true);
  }, []);

  const toggleTheme = () => {
    const nextIsDark = !isDark;
    setIsDark(nextIsDark);

    if (nextIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const today = useMemo(() => {
    return new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/75">
      <div className="flex h-20 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm md:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            type="button"
            title="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300">
                <Sparkles className="h-3.5 w-3.5" />
                ERP Premium
              </span>
            </div>

            <h1 className="truncate text-xl font-bold text-slate-900 dark:text-white">{label}</h1>
            <p className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">{today}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div
            className={cn(
              'hidden items-center overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all dark:border-slate-800 dark:bg-slate-900 sm:flex',
              showSearch ? 'w-[240px] px-3' : 'w-11 justify-center'
            )}
          >
            {showSearch ? (
              <>
                <Search className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  autoFocus
                  onBlur={() => setShowSearch(false)}
                  placeholder="Buscar cliente, pedido, produto..."
                  className="h-11 w-full border-0 bg-transparent px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
                />
              </>
            ) : (
              <button
                onClick={() => setShowSearch(true)}
                className="flex h-11 w-11 items-center justify-center text-slate-400 transition hover:text-sky-500 dark:text-slate-500 dark:hover:text-sky-400"
                type="button"
                title="Buscar"
              >
                <Search className="h-4.5 w-4.5" />
              </button>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 shadow-sm transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/30 dark:hover:text-sky-400"
            type="button"
            title="Alternar tema"
          >
            {isDark ? <MoonStar className="h-4.5 w-4.5" /> : <SunMedium className="h-4.5 w-4.5" />}
            <span className="hidden md:inline">{isDark ? 'Dark' : 'Light'}</span>
          </button>

          <button
            className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/30 dark:hover:text-sky-400"
            type="button"
            title="Notificações"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
          </button>

          <button
            className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-sky-300 hover:text-sky-600 md:inline-flex dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/30 dark:hover:text-sky-400"
            type="button"
            title="Configurações"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>

          <div className="ml-1 hidden h-10 w-px bg-slate-200 md:block dark:bg-slate-800" />

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm md:flex dark:border-slate-800 dark:bg-slate-900">
            <div className="text-right">
              <p className="max-w-[140px] truncate text-sm font-semibold text-slate-900 dark:text-white">
                {user?.name || 'Usuário'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user?.role === 'admin' ? 'Administrador' : 'Vendedor'}
              </p>
            </div>

            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold text-white"
              title={user?.name ?? ''}
            >
              {initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
