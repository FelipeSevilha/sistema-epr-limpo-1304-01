'use client';

import { useMemo, useState } from 'react';
import {
  Target,
  TrendingUp,
  Wallet,
  Users,
  ChevronDown,
  CircleCheck,
  Clock3,
} from 'lucide-react';

type MetaCard = {
  id: string;
  titulo: string;
  periodo: string;
  meta: number;
  realizado: number;
  categoria: string;
  responsavel: string;
  status: 'Em andamento' | 'Concluída' | 'Planejada';
};

const metasBase: MetaCard[] = [
  {
    id: '1',
    titulo: 'Meta de faturamento',
    periodo: 'Próximos 3 meses',
    meta: 150000,
    realizado: 118500,
    categoria: 'Financeiro',
    responsavel: 'Diretoria',
    status: 'Em andamento',
  },
  {
    id: '2',
    titulo: 'Meta comercial por vendedor',
    periodo: 'Próximos 6 meses',
    meta: 280000,
    realizado: 164000,
    categoria: 'Vendas',
    responsavel: 'Equipe comercial',
    status: 'Em andamento',
  },
  {
    id: '3',
    titulo: 'Meta anual da operação',
    periodo: '1 ano',
    meta: 650000,
    realizado: 0,
    categoria: 'Estratégico',
    responsavel: 'Gestão',
    status: 'Planejada',
  },
  {
    id: '4',
    titulo: 'Redução de desperdício',
    periodo: 'Próximos 3 meses',
    meta: 12,
    realizado: 9,
    categoria: 'Produção',
    responsavel: 'Chão de fábrica',
    status: 'Em andamento',
  },
];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function MetasPage() {
  const [periodo, setPeriodo] = useState('Todos');

  const periodos = ['Todos', 'Próximos 3 meses', 'Próximos 6 meses', '1 ano'];

  const filtered = useMemo(() => {
    return metasBase.filter((meta) => periodo === 'Todos' || meta.periodo === periodo);
  }, [periodo]);

  const stats = {
    total: metasBase.length,
    andamento: metasBase.filter((m) => m.status === 'Em andamento').length,
    planejadas: metasBase.filter((m) => m.status === 'Planejada').length,
    concluidas: metasBase.filter((m) => m.status === 'Concluída').length,
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="erp-section-title">Metas da empresa</h2>
          <p className="erp-section-subtitle">
            Planejamento por período, vendedor, financeiro e operação
          </p>
        </div>

        <div className="relative">
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="erp-input w-56 appearance-none pr-10"
          >
            {periodos.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Total de metas
            </p>
            <Target className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Em andamento
            </p>
            <Clock3 className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.andamento}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Planejadas
            </p>
            <Wallet className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.planejadas}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Concluídas
            </p>
            <CircleCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.concluidas}</p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {filtered.map((meta) => {
          const percentual =
            meta.meta > 0 ? Math.min((meta.realizado / meta.meta) * 100, 100) : 0;

          const isPercentual = meta.categoria === 'Produção';

          return (
            <div key={meta.id} className="erp-card p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {meta.categoria}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {meta.titulo}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {meta.periodo}
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    meta.status === 'Concluída'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : meta.status === 'Em andamento'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      : 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                  }`}
                >
                  {meta.status}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Meta</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {isPercentual ? `${meta.meta}%` : fmt(meta.meta)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Realizado</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {isPercentual ? `${meta.realizado}%` : fmt(meta.realizado)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-300">Progresso</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {percentual.toFixed(1)}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
                    style={{ width: `${percentual}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                {meta.categoria === 'Vendas' ? (
                  <Users className="h-4 w-4 text-sky-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                )}
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Responsável: <span className="font-semibold">{meta.responsavel}</span>
                </p>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
