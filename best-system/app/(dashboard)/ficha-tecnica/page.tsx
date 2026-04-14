'use client';

import {
  ClipboardList,
  Layers3,
  Printer,
  Sparkles,
  Link2,
} from 'lucide-react';

const ficha = {
  produto: 'Caderno 96 folhas',
  categoria: 'Cadernos',
  custoBase: 'R$ 8,45',
  variacoes: [
    'Miolo P&B ou colorido',
    'BOPP fosco ou brilho',
    'Wire-o preto ou branco',
  ],
  materiais: {
    Miolo: [
      { nome: 'Papel sulfite 75g', quantidade: '96 folhas' },
    ],
    Capa: [
      { nome: 'Cartão Paraná 625g', quantidade: '2 folhas' },
      { nome: 'Adesivo para capa', quantidade: '2 folhas' },
    ],
    Impressão: [
      { nome: 'Impressão capa colorida', quantidade: '2 impressões' },
      { nome: 'Impressão miolo P&B', quantidade: '96 impressões' },
    ],
    Acabamento: [
      { nome: 'Wire-o', quantidade: '1 unidade' },
      { nome: 'BOPP', quantidade: '2 faces' },
    ],
  },
};

export default function FichaTecnicaPage() {
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Fichas cadastradas
            </p>
            <ClipboardList className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">1</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Com variações
            </p>
            <Layers3 className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">1</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Itens de impressão
            </p>
            <Printer className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">2</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Produto em destaque
            </p>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {ficha.produto}
          </p>
        </div>
      </section>

      <section className="erp-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Ficha técnica
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
              {ficha.produto}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {ficha.categoria}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Custo base estimado
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              {ficha.custoBase}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <div className="mb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-sky-500" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Variações e regras
              </p>
            </div>

            <div className="space-y-2">
              {ficha.variacoes.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/60">
            <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
              Resumo industrial
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total de itens
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  7
                </p>
              </div>

              <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Grupos
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                  4
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(ficha.materiais).map(([grupo, itens]) => (
            <div
              key={grupo}
              className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {grupo}
              </p>

              <div className="mt-3 space-y-2">
                {itens.map((item) => (
                  <div
                    key={item.nome}
                    className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-950"
                  >
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {item.nome}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.quantidade}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
