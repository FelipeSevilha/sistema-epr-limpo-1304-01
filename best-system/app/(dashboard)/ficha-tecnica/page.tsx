'use client';

import { useMemo, useState } from 'react';
import {
  ClipboardList,
  Search,
  Plus,
  Layers3,
  Printer,
  Sparkles,
  Link2,
} from 'lucide-react';

type Material = {
  nome: string;
  quantidade: string;
  grupo: 'Miolo' | 'Capa' | 'Acabamento' | 'Impressão';
};

type Ficha = {
  id: string;
  produto: string;
  categoria: string;
  custoBase: number;
  variacoes: string[];
  materiais: Material[];
};

const fichasBase: Ficha[] = [
  {
    id: '1',
    produto: 'Caderno 96 folhas',
    categoria: 'Cadernos',
    custoBase: 8.45,
    variacoes: ['Miolo P&B ou colorido', 'BOPP fosco ou brilho', 'Wire-o preto ou branco'],
    materiais: [
      { grupo: 'Miolo', nome: 'Papel sulfite 75g', quantidade: '96 folhas', },
      { grupo: 'Capa', nome: 'Cartão Paraná 625g', quantidade: '2 folhas', },
      { grupo: 'Capa', nome: 'Adesivo para capa', quantidade: '2 folhas', },
      { grupo: 'Impressão', nome: 'Impressão capa colorida', quantidade: '2 impressões', },
      { grupo: 'Impressão', nome: 'Impressão miolo P&B', quantidade: '96 impressões', },
      { grupo: 'Acabamento', nome: 'Wire-o', quantidade: '1 unidade', },
      { grupo: 'Acabamento', nome: 'BOPP', quantidade: '2 faces', },
    ],
  },
  {
    id: '2',
    produto: 'Agenda personalizada A5',
    categoria: 'Agendas',
    custoBase: 12.9,
    variacoes: ['Laminação brilho', 'Elástico opcional'],
    materiais: [
      { grupo: 'Miolo', nome: 'Papel offset 90g', quantidade: '180 folhas', },
      { grupo: 'Capa', nome: 'Papelão holler', quantidade: '2 chapas', },
      { grupo: 'Capa', nome: 'Papel couchê 250g', quantidade: '2 folhas', },
      { grupo: 'Impressão', nome: 'Impressão miolo 1x1', quantidade: '180 impressões', },
      { grupo: 'Acabamento', nome: 'Espiral metálico', quantidade: '1 unidade', },
    ],
  },
  {
    id: '3',
    produto: 'Cardápio laminado',
    categoria: 'Cardápios',
    custoBase: 4.75,
    variacoes: ['Laminação fosca', 'Dobra central'],
    materiais: [
      { grupo: 'Capa', nome: 'Papel supremo 300g', quantidade: '2 folhas', },
      { grupo: 'Impressão', nome: 'Impressão colorida frente e verso', quantidade: '2 impressões', },
      { grupo: 'Acabamento', nome: 'Laminação BOPP', quantidade: '2 faces', },
    ],
  },
];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function FichaTecnicaPage() {
  const [search, setSearch] = useState('');
  const [fichas] = useState<Ficha[]>(fichasBase);
  const [selecionada, setSelecionada] = useState<Ficha | null>(fichasBase[0]);

  const filtered = useMemo(() => {
    return fichas.filter((f) => {
      return (
        f.produto.toLowerCase().includes(search.toLowerCase()) ||
        f.categoria.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [fichas, search]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Fichas cadastradas</p>
            <ClipboardList className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{fichas.length}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Com variações</p>
            <Layers3 className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{fichas.filter((f) => f.variacoes.length > 0).length}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Itens de impressão</p>
            <Printer className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {fichas.reduce((sum, ficha) => sum + ficha.materiais.filter((m) => m.grupo === 'Impressão').length, 0)}
          </p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Produto em destaque</p>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white">
            {selecionada?.produto ?? '—'}
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[340px,1fr]">
        <div className="erp-card overflow-hidden">
          <div className="border-b border-slate-200/70 px-5 py-4 dark:border-slate-800">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ficha técnica..."
                className="erp-input w-full pl-10"
              />
            </div>

            <button className="erp-button-primary mt-3 w-full">
              <Plus className="mr-2 h-4 w-4" />
              Nova ficha técnica
            </button>
          </div>

          <div className="space-y-2 p-3">
            {filtered.map((ficha) => (
              <button
                key={ficha.id}
                onClick={() => setSelecionada(ficha)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  selecionada?.id === ficha.id
                    ? 'border-sky-500 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10'
                    : 'border-slate-200 bg-white hover:border-sky-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/20'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{ficha.produto}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{ficha.categoria}</p>
                <p className="mt-2 text-xs font-medium text-sky-600 dark:text-sky-400">Custo base: {fmt(ficha.custoBase)}</p>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Nenhuma ficha encontrada.
              </div>
            )}
          </div>
        </div>

        <div className="erp-card p-6">
          {selecionada ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Ficha técnica</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{selecionada.produto}</h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{selecionada.categoria}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Custo base estimado</p>
                  <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{fmt(selecionada.custoBase)}</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="mb-3 flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-sky-500" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">Variações e regras</p>
                  </div>

                  <div className="space-y-2">
                    {selecionada.variacoes.map((item) => (
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
                  <p className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Resumo industrial</p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Total de itens</p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selecionada.materiais.length}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Grupos</p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {Array.from(new Set(selecionada.materiais.map((m) => m.grupo))).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {(['Miolo', 'Capa', 'Impressão', 'Acabamento'] as const).map((grupo) => {
                  const itens = selecionada.materiais.filter((m) => m.grupo === grupo);

                  return (
                    <div key={grupo} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{grupo}</p>
                      <div className="mt-3 space-y-2">
                        {itens.length > 0 ? (
                          itens.map((item, index) => (
                            <div key={`${item.nome}-${index}`} className="rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-950">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.nome}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{item.quantidade}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500">Sem itens nesse grupo.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-sm text-slate-500 dark:text-slate-400">
              Selecione uma ficha técnica para visualizar os detalhes.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
