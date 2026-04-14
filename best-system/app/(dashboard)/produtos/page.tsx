'use client';

import { useMemo, useState } from 'react';
import {
  Factory,
  Boxes,
  Clock3,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Search,
  ShieldAlert,
  Layers3,
} from 'lucide-react';

type OrdemStatus =
  | 'Aguardando material'
  | 'Pronta para produção'
  | 'Em produção'
  | 'Pausada'
  | 'Finalizada';

type OrdemProducao = {
  id: string;
  numero: string;
  pedidoNumero: string;
  cliente: string;
  produto: string;
  quantidade: number;
  status: OrdemStatus;
  prazo: string;
  progresso: number;
  materiaisOk: boolean;
  custoPrevisto: number;
};

const ordensBase: OrdemProducao[] = [
  {
    id: '1',
    numero: 'OP-24001',
    pedidoNumero: 'P-1042',
    cliente: 'Construtora Horizonte',
    produto: 'Catálogos A4',
    quantidade: 500,
    status: 'Em produção',
    prazo: '2026-04-18',
    progresso: 62,
    materiaisOk: true,
    custoPrevisto: 4200,
  },
  {
    id: '2',
    numero: 'OP-24002',
    pedidoNumero: 'P-1048',
    cliente: 'Escola Futuro Brilhante',
    produto: 'Agendas personalizadas',
    quantidade: 300,
    status: 'Aguardando material',
    prazo: '2026-04-21',
    progresso: 0,
    materiaisOk: false,
    custoPrevisto: 6900,
  },
  {
    id: '3',
    numero: 'OP-24003',
    pedidoNumero: 'P-1051',
    cliente: 'Auto Peças JR',
    produto: 'Banners 2x1m',
    quantidade: 18,
    status: 'Pronta para produção',
    prazo: '2026-04-16',
    progresso: 0,
    materiaisOk: true,
    custoPrevisto: 2150,
  },
  {
    id: '4',
    numero: 'OP-24004',
    pedidoNumero: 'P-1053',
    cliente: 'Bella Vista',
    produto: 'Cardápios laminados',
    quantidade: 120,
    status: 'Pausada',
    prazo: '2026-04-17',
    progresso: 35,
    materiaisOk: true,
    custoPrevisto: 1380,
  },
  {
    id: '5',
    numero: 'OP-24005',
    pedidoNumero: 'P-1039',
    cliente: 'Supermercado União',
    produto: 'Flyers A5',
    quantidade: 5000,
    status: 'Finalizada',
    prazo: '2026-04-14',
    progresso: 100,
    materiaisOk: true,
    custoPrevisto: 650,
  },
];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const statusConfig: Record<OrdemStatus, string> = {
  'Aguardando material': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  'Pronta para produção': 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  'Em produção': 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  Pausada: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Finalizada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

export default function ProducaoPage() {
  const [search, setSearch] = useState('');
  const [lista, setLista] = useState<OrdemProducao[]>(ordensBase);
  const [statusFiltro, setStatusFiltro] = useState<'Todos' | OrdemStatus>('Todos');

  const filtered = useMemo(() => {
    return lista.filter((op) => {
      const matchSearch =
        op.numero.toLowerCase().includes(search.toLowerCase()) ||
        op.pedidoNumero.toLowerCase().includes(search.toLowerCase()) ||
        op.cliente.toLowerCase().includes(search.toLowerCase()) ||
        op.produto.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFiltro === 'Todos' || op.status === statusFiltro;
      return matchSearch && matchStatus;
    });
  }, [lista, search, statusFiltro]);

  const updateStatus = (id: string, status: OrdemStatus, progresso?: number) => {
    setLista((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              progresso:
                progresso !== undefined
                  ? progresso
                  : status === 'Finalizada'
                  ? 100
                  : item.progresso,
            }
          : item
      )
    );
  };

  const stats = {
    aguardando: lista.filter((i) => i.status === 'Aguardando material').length,
    prontas: lista.filter((i) => i.status === 'Pronta para produção').length,
    producao: lista.filter((i) => i.status === 'Em produção').length,
    finalizadas: lista.filter((i) => i.status === 'Finalizada').length,
  };

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Aguardando material</p>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.aguardando}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Prontas</p>
            <Boxes className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.prontas}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Em produção</p>
            <Factory className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.producao}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Finalizadas</p>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.finalizadas}</p>
        </div>
      </section>

      <section className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar OP, pedido, cliente ou produto..."
                className="erp-input w-80 pl-10"
              />
            </div>

            {(['Todos', 'Aguardando material', 'Pronta para produção', 'Em produção', 'Pausada', 'Finalizada'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFiltro(status)}
                className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                  statusFiltro === status
                    ? 'bg-sky-500 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/30 dark:hover:text-sky-400'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <button className="erp-button-primary">
            <Layers3 className="mr-2 h-4 w-4" />
            Gerar OP manual
          </button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-2">
          {filtered.map((op) => (
            <div key={op.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{op.numero}</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{op.produto}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Pedido {op.pedidoNumero} • {op.cliente}
                  </p>
                </div>

                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig[op.status]}`}>
                  {op.status}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Quantidade</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {op.quantidade.toLocaleString('pt-BR')}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Prazo</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {new Date(op.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Custo previsto</p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">{fmt(op.custoPrevisto)}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>Progresso</span>
                  <span>{op.progresso}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all"
                    style={{ width: `${op.progresso}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Materiais</p>
                <p className={`mt-2 text-sm font-medium ${op.materiaisOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {op.materiaisOk ? 'Estoque validado e liberado para produção' : 'Falta material para iniciar a produção'}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => updateStatus(op.id, 'Em produção', Math.max(op.progresso, 10))}
                  className="erp-button-primary px-3 py-2 text-xs"
                >
                  <PlayCircle className="mr-1.5 h-4 w-4" />
                  Iniciar
                </button>

                <button
                  onClick={() => updateStatus(op.id, 'Pausada')}
                  className="erp-button-secondary px-3 py-2 text-xs"
                >
                  <PauseCircle className="mr-1.5 h-4 w-4" />
                  Pausar
                </button>

                <button
                  onClick={() => updateStatus(op.id, 'Finalizada', 100)}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Finalizar
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Nenhuma ordem de produção encontrada com os filtros atuais.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
