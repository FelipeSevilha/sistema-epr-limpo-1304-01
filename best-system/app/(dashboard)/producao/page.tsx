'use client';

import {
  Factory,
  Boxes,
  Clock3,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';

const ordens = [
  {
    id: 'OP-24001',
    pedido: 'P-1042',
    cliente: 'Construtora Horizonte',
    produto: 'Catálogos A4',
    quantidade: 500,
    status: 'Em produção',
    prazo: '18/04/2026',
    progresso: 62,
    materiaisOk: true,
    custoPrevisto: 'R$ 4.200,00',
  },
  {
    id: 'OP-24002',
    pedido: 'P-1048',
    cliente: 'Escola Futuro Brilhante',
    produto: 'Agendas personalizadas',
    quantidade: 300,
    status: 'Aguardando material',
    prazo: '21/04/2026',
    progresso: 0,
    materiaisOk: false,
    custoPrevisto: 'R$ 6.900,00',
  },
  {
    id: 'OP-24003',
    pedido: 'P-1051',
    cliente: 'Auto Peças JR',
    produto: 'Banners 2x1m',
    quantidade: 18,
    status: 'Pronta para produção',
    prazo: '16/04/2026',
    progresso: 0,
    materiaisOk: true,
    custoPrevisto: 'R$ 2.150,00',
  },
];

function getStatusClass(status: string) {
  switch (status) {
    case 'Aguardando material':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
    case 'Pronta para produção':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300';
    case 'Em produção':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300';
    case 'Pausada':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    case 'Finalizada':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

export default function ProducaoPage() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Aguardando material
            </p>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">1</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Prontas
            </p>
            <Boxes className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">1</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Em produção
            </p>
            <Factory className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">1</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Finalizadas hoje
            </p>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">0</p>
        </div>
      </section>

      <section className="erp-card p-5">
        <div className="mb-5">
          <h2 className="erp-section-title">Ordens de produção</h2>
          <p className="erp-section-subtitle">
            Controle operacional da fábrica
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {ordens.map((op) => (
            <div
              key={op.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {op.id}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {op.produto}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Pedido {op.pedido} • {op.cliente}
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(op.status)}`}
                >
                  {op.status}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Quantidade
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {op.quantidade}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Prazo
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {op.prazo}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Custo previsto
                  </p>
                  <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {op.custoPrevisto}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>Progresso</span>
                  <span>{op.progresso}%</span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
                    style={{ width: `${op.progresso}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Materiais
                </p>
                <p
                  className={`mt-2 text-sm font-medium ${
                    op.materiaisOk
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {op.materiaisOk
                    ? 'Estoque validado e liberado para produção'
                    : 'Falta material para iniciar a produção'}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button className="erp-button-primary px-3 py-2 text-xs">
                  <PlayCircle className="mr-1.5 h-4 w-4" />
                  Iniciar
                </button>

                <button className="erp-button-secondary px-3 py-2 text-xs">
                  <PauseCircle className="mr-1.5 h-4 w-4" />
                  Pausar
                </button>

                <button className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600">
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Finalizar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
