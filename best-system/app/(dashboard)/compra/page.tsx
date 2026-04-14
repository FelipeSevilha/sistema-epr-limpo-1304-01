'use client';

import { ShoppingBag, AlertTriangle, CircleDollarSign } from 'lucide-react';

const compras = [
  {
    item: 'Wire-o 1" branco',
    fornecedor: 'Papelaria Central',
    necessidade: '120 un',
    custo: 'R$ 380,00',
    status: 'Urgente',
  },
  {
    item: 'Papel sulfite 75g',
    fornecedor: 'Distribuidora Alpha',
    necessidade: '10.000 folhas',
    custo: 'R$ 920,00',
    status: 'Planejado',
  },
];

export default function ComprasPage() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Itens para compra
            </p>
            <ShoppingBag className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">2</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Urgentes
            </p>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">1</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Custo previsto
            </p>
            <CircleDollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">R$ 1.300,00</p>
        </div>
      </section>

      <section className="erp-card p-5">
        <h2 className="erp-section-title">Sugestão de compras</h2>
        <p className="erp-section-subtitle">
          Itens gerados a partir do estoque mínimo e da produção
        </p>

        <div className="mt-5 space-y-3">
          {compras.map((item) => (
            <div
              key={item.item}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-slate-900 dark:text-white">
                    {item.item}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Fornecedor: {item.fornecedor}
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.status === 'Urgente'
                      ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                      : 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Necessidade
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {item.necessidade}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Custo previsto
                  </p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {item.custo}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
