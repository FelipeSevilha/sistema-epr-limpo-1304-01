'use client';

import { useMemo, useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Boxes,
  DollarSign,
  Tag,
  ClipboardList,
  Eye,
  Pencil,
  Link2,
} from 'lucide-react';
import Link from 'next/link';

type ProdutoItem = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  precoBase: number;
  custoEstimado: number;
  fichaTecnica: boolean;
  variacoes: string[];
};

const produtosBase: ProdutoItem[] = [
  {
    id: '1',
    nome: 'Caderno 96 folhas',
    categoria: 'Cadernos',
    descricao: 'Caderno personalizado com capa colorida e opção de wire-o.',
    precoBase: 18.9,
    custoEstimado: 8.45,
    fichaTecnica: true,
    variacoes: ['Miolo P&B', 'Miolo colorido', 'BOPP fosco', 'BOPP brilho'],
  },
  {
    id: '2',
    nome: 'Cardápio laminado',
    categoria: 'Cardápios',
    descricao: 'Cardápio laminado com acabamento premium.',
    precoBase: 12.5,
    custoEstimado: 4.75,
    fichaTecnica: true,
    variacoes: ['Laminação fosca', 'Laminação brilho'],
  },
  {
    id: '3',
    nome: 'Banner 2x1m',
    categoria: 'Comunicação Visual',
    descricao: 'Banner lona com impressão colorida e acabamento.',
    precoBase: 85,
    custoEstimado: 38.4,
    fichaTecnica: false,
    variacoes: ['Com bastão', 'Com ilhós'],
  },
];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export default function ProdutosPage() {
  const [search, setSearch] = useState('');
  const [produtos] = useState<ProdutoItem[]>(produtosBase);
  const [selected, setSelected] = useState<ProdutoItem | null>(null);

  const filtered = useMemo(() => {
    return produtos.filter((item) => {
      return (
        item.nome.toLowerCase().includes(search.toLowerCase()) ||
        item.categoria.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [produtos, search]);

  const totalProdutos = produtos.length;
  const comFicha = produtos.filter((p) => p.fichaTecnica).length;
  const ticketMedio = produtos.reduce((sum, p) => sum + p.precoBase, 0) / produtos.length;
  const custoMedio = produtos.reduce((sum, p) => sum + p.custoEstimado, 0) / produtos.length;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Produtos cadastrados
            </p>
            <Package className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalProdutos}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Com ficha técnica
            </p>
            <ClipboardList className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{comFicha}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Preço médio
            </p>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(ticketMedio)}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Custo médio
            </p>
            <Boxes className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(custoMedio)}</p>
        </div>
      </section>

      <section className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="erp-input w-80 pl-10"
            />
          </div>

          <button
            type="button"
            className="erp-button-primary"
            onClick={() => alert('Na próxima etapa eu adiciono o formulário premium de produto.')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((produto) => (
            <div
              key={produto.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {produto.categoria}
                  </p>
                  <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                    {produto.nome}
                  </h3>
                </div>

                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    produto.fichaTecnica
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                  }`}
                >
                  {produto.fichaTecnica ? 'Com ficha' : 'Sem ficha'}
                </span>
              </div>

              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                {produto.descricao}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Preço base</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {fmt(produto.precoBase)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Custo estimado</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {fmt(produto.custoEstimado)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Variações
                </p>

                <div className="flex flex-wrap gap-2">
                  {produto.variacoes.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(produto)}
                  className="erp-button-secondary px-3 py-2 text-xs"
                >
                  <Eye className="mr-1.5 h-4 w-4" />
                  Ver
                </button>

                <button
                  type="button"
                  onClick={() => alert('Na próxima etapa eu adiciono a edição premium do produto.')}
                  className="erp-button-secondary px-3 py-2 text-xs"
                >
                  <Pencil className="mr-1.5 h-4 w-4" />
                  Editar
                </button>

                {produto.fichaTecnica ? (
                  <Link
                    href="/ficha-tecnica"
                    className="inline-flex items-center justify-center rounded-2xl bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-600"
                  >
                    <Link2 className="mr-1.5 h-4 w-4" />
                    Ver Ficha
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => alert('Esse produto ainda não possui ficha técnica cadastrada.')}
                    className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
                  >
                    <ClipboardList className="mr-1.5 h-4 w-4" />
                    Criar Ficha
                  </button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Produto
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {selected.nome}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selected.categoria}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="erp-button-secondary px-3 py-2 text-xs"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Preço base
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.precoBase)}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Custo estimado
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.custoEstimado)}
                </p>
              </div>
            </div>

            <div className="mt-4 erp-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Descrição
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                {selected.descricao}
              </p>
            </div>

            <div className="mt-4 erp-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Variações
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.variacoes.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 erp-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Integração industrial
              </p>
              <div className="mt-3">
                {selected.fichaTecnica ? (
                  <Link
                    href="/ficha-tecnica"
                    className="inline-flex items-center justify-center rounded-2xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-600"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Abrir ficha técnica
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => alert('Esse produto ainda precisa de ficha técnica para integrar com produção e estoque.')}
                    className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                  >
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Produto sem ficha técnica
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
