'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Wallet,
  FileText,
  Package,
  ShoppingCart,
  Users,
  Award,
  Target,
  Boxes,
  ChartBar as BarChart3,
  ChevronLeft,
  ChevronRight,
  Printer,
  LogOut,
  UserCog,
  ShieldCheck,
  Factory,
  ClipboardList,
  ShoppingBag,
  TrendingUp, // 👈 ICONE DO CRM
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  soon?: boolean;
};

const ALL_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet, adminOnly: true },
  { href: '/orcamentos', label: 'Orçamentos', icon: FileText },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/clientes', label: 'Clientes', icon: Users },

  // 🚀 NOVO CRM
  { href: '/crm', label: 'CRM', icon: TrendingUp },

  { href: '/comissoes', label: 'Comissões', icon: Award, adminOnly: true },
  { href: '/metas', label: 'Metas', icon: Target, adminOnly: true },
  { href: '/estoque', label: 'Estoque', icon: Boxes, adminOnly: true },
  { href: '/usuarios', label: 'Usuários', icon: UserCog, adminOnly: true },

  { href: '/producao', label: 'Produção', icon: Factory, adminOnly: true, soon: true },
  { href: '/ficha-tecnica', label: 'Ficha Técnica', icon: ClipboardList, adminOnly: true, soon: true },
  { href: '/compras', label: 'Compras', icon: ShoppingBag, adminOnly: true, soon: true },

  { href: '/painel-estrategico', label: 'Painel Estratégico', icon: BarChart3, adminOnly: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const isAdmin = user?.role === 'admin';

  const navItems = useMemo(() => {
    return ALL_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  }, [isAdmin]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const roleLabel = isAdmin ? 'Administrador' : 'Vendedor';
  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'GS';

  return (
    <aside
      className={cn(
        'relative hidden md:flex h-full flex-col border-r border-slate-200/70 bg-white/85 backdrop-blur-xl transition-all duration-300 dark:border-slate-800 dark:bg-slate-950/90',
        collapsed ? 'w-[88px]' : 'w-[288px]'
      )}
    >
      <div
        className={cn(
          'flex items-center gap-3 border-b border-slate-200/70 px-4 py-5 dark:border-slate-800',
          collapsed && 'justify-center px-3'
        )}
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-blue-600 text-white shadow-lg shadow-sky-500/20">
          <Printer className="h-5 w-5" />
        </div>

        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
              ERP Premium
            </p>
            <p className="truncate text-base font-bold text-slate-900 dark:text-white">
              Gráfica D&apos;Sevilha
            </p>
          </div>
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-lg transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:text-sky-400"
        type="button"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <div className="mb-4 px-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Navegação
            </p>
          </div>
        )}

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    isActive
                      ? 'text-white'
                      : 'text-slate-400 transition-colors group-hover:text-sky-500 dark:text-slate-500 dark:group-hover:text-sky-400'
                  )}
                />

                {!collapsed && (
                  <>
                    <span className="truncate">{item.label}</span>

                    <div className="ml-auto flex items-center gap-2">
                      {item.soon && !isActive && (
                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                          Novo
                        </span>
                      )}

                      {isActive && <span className="h-2 w-2 rounded-full bg-white/90" />}
                    </div>
                  </>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={cn('border-t border-slate-200/70 p-3 dark:border-slate-800', collapsed && 'px-2')}>
        {!collapsed ? (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold text-white">
                {initials}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user?.name || 'Usuário'}</p>

                <div className="mt-0.5 flex items-center gap-1.5">
                  {isAdmin && <ShieldCheck className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />}
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                title="Sair"
                type="button"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-xs font-bold text-white">
              {initials}
            </div>

            <button
              onClick={handleLogout}
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              title="Sair"
              type="button"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
