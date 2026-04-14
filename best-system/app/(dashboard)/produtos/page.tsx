'use client';

import { useEffect, useMemo, useState } from 'react';
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
  Target,
  TrendingUp,
  AlertTriangle,
  BadgeDollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type ProdutoItem = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  custo: number;
  preco: number;
  margem: number;
  unidade: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
};

type FichaTecnicaItem = {
  id: string;
  produto_nome: string;
  material_nome: string;
  quantidade: number;
  unidade: string;
};

type EstoqueItem = {
  id: string;
  item: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  estoque_minimo: number;
  fornecedor: string;
  valor_unitario: number;
};

type CostBreakdown = {
  material: number;
  impressao: number;
  acabamento: number;
  operacional: number;
  total: number;
};

type ProdutoView = ProdutoItem & {
  fichaTecnica: boolean;
  variacoes: string[];
  costBreakdown: CostBreakdown;
  custoUnitarioEstimado: number;
  precoSugerido: number;
  margemAtualCalculada: number;
  alertaPreco: 'ok' | 'baixo' | 'sem_ficha';
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

function normalizeText(value: string) {
  return (value || '').toLowerCase().trim();
}

function inferGroup(materialName: string, categoria: string) {
  const text = `${materialName} ${categoria}`.toLowerCase();

  if (
    text.includes('impress') ||
    text.includes('pb') ||
    text.includes('p&b') ||
    text.includes('colorid') ||
    text.includes('cmyk') ||
    text.includes('toner')
  ) {
    return 'impressao';
  }

  if (
    text.includes('wire') ||
    text.includes('bopp') ||
    text.includes('lamina') ||
    text.includes('laminação') ||
    text.includes('laminacao') ||
    text.includes('verniz') ||
    text.includes('faca') ||
    text.includes('corte') ||
    text.includes('vinco') ||
    text.includes('dobr') ||
    text.includes('espiral') ||
    text.includes('acabamento')
  ) {
    return 'acabamento';
  }

  return 'material';
}

function calculateOperationalCost(
  quantidade: number,
  material: number,
  impressao: number,
  acabamento: number
) {
  const baseMovimentacao = quantidade * 0.12;
  const baseSetup = 18;
  const percentual = (material + impressao + acabamento) * 0.08;
  return Number((baseMovimentacao + baseSetup + percentual).toFixed(2));
}

function buildCostBreakdown(
  produtoNome: string,
  quantidadeProducao: number,
  ficha: FichaTecnicaItem[],
  estoque: EstoqueItem[]
): CostBreakdown {
  const materiais = ficha.filter((f) => normalizeText(f.produto_nome) === normalizeText(produtoNome));

  let material = 0;
  let impressao = 0;
  let acabamento = 0;

  for (const item of materiais) {
    const itemEstoque = estoque.find(
      (e) => normalizeText(e.item) === normalizeText(item.material_nome)
    );

    if (!itemEstoque) continue;

    const consumoTotal = Number(item.quantidade || 0) * Number(quantidadeProducao || 0);
    const custoItem = consumoTotal * Number(itemEstoque.valor_unitario || 0);
    const group = inferGroup(item.material_nome, itemEstoque.categoria || '');

    if (group === 'impressao') {
      impressao += custoItem;
    } else if (group === 'acabamento') {
      acabamento += custoItem;
    } else {
      material += custoItem;
    }
  }

  const operacional = calculateOperationalCost(
    quantidadeProducao,
    material,
    impressao,
    acabamento
  );

  const total = material + impressao + acabamento + operacional;

  return {
    material: Number(material.toFixed(2)),
    impressao: Number(impressao.toFixed(2)),
    acabamento: Number(acabamento.toFixed(2)),
    operacional: Number(operacional.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

function calculateSuggestedPrice(custo: number, margemAlvo: number) {
  if (custo <= 0) return 0;
  const divisor = 1 - margemAlvo / 100;
  if (divisor <= 0) return custo;
  return Number((custo / divisor).toFixed(2));
}

function calculateMargin(preco: number, custo: number) {
  if (preco <= 0) return 0;
  return Number((((preco - custo) / preco) * 100).toFixed(2));
}

export default function ProdutosPage() {
  const [search, setSearch] = useState('');
  const [produtos, setProdutos] = useState<ProdutoItem[]>([]);
  const [ficha, setFicha] = useState<FichaTecnicaItem[]>([]);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [selected, setSelected] = useState<ProdutoView | null>(null);
  const [loading, setLoading] = useState(true);
  const [margemAlvo, setMargemAlvo] = useState(30);
  const [error, setError] = useState('');

  async function fetchData() {
    try {
      setLoading(true);
      setError('');

      const [produtosRes, fichaRes, estoqueRes] = await Promise.all([
        supabase.from('produtos').select('*').order('nome', { ascending: true }),
        supabase.from('ficha_tecnica').select('*'),
        supabase.from('estoque').select('*'),
      ]);

      if (produtosRes.error) throw produtosRes.error;
      if (fichaRes.error) throw fichaRes.error;
      if (estoqueRes.error) throw estoqueRes.error;

      setProdutos((produtosRes.data as ProdutoItem[]) || []);
      setFicha((fichaRes.data as FichaTecnicaItem[]) || []);
      setEstoque((estoqueRes.data as EstoqueItem[]) || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const produtosView = useMemo<ProdutoView[]>(() => {
    return produtos.map((produto) => {
      const itensFicha = ficha.filter(
        (f) => normalizeText(f.produto_nome) === normalizeText(produto.nome)
      );

      const costBreakdown = buildCostBreakdown(produto.nome, 1, ficha, estoque);
      const custoUnitarioEstimado = Number(costBreakdown.total || 0);
      const precoSugerido = calculateSuggestedPrice(custoUnitarioEstimado, margemAlvo);
      const margemAtualCalculada = calculateMargin(Number(produto.preco || 0), custoUnitarioEstimado);

      let alertaPreco: ProdutoView['alertaPreco'] = 'ok';
      if (!itensFicha.length) {
        alertaPreco = 'sem_ficha';
      } else if (Number(produto.preco || 0) < precoSugerido) {
        alertaPreco = 'baixo';
      }

      return {
        ...produto,
        fichaTecnica: itensFicha.length > 0,
        variacoes: itensFicha.map((i) => i.material_nome),
        costBreakdown,
        custoUnitarioEstimado,
        precoSugerido,
        margemAtualCalculada,
        alertaPreco,
      };
    });
  }, [produtos, ficha, estoque, margemAlvo]);

  const filtered = useMemo(() => {
    return produtosView.filter((item) => {
      return (
        item.nome.toLowerCase().includes(search.toLowerCase()) ||
        item.categoria.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [produtosView, search]);

  const totalProdutos = produtosView.length;
  const comFicha = produtosView.filter((p) => p.fichaTecnica).length;
  const precoMedio = produtosView.length
    ? produtosView.reduce((sum, p) => sum + Number(p.preco || 0), 0) / produtosView.length
    : 0;
  const custoMedio = produtosView.length
    ? produtosView.reduce((sum, p) => sum + Number(p.custoUnitarioEstimado || 0), 0) / produtosView.length
    : 0;
  const abaixoSugestao = produtosView.filter((p) => p.alertaPreco === 'baixo').length;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="erp-section-title">Produtos</h2>
          <p className="erp-section-subtitle">
            Precificação automática com base em custo estimado e margem alvo
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Target className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Margem alvo
          </span>
          <select
            value={margemAlvo}
            onChange={(e) => setMargemAlvo(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value={20}>20%</option>
            <option value={25}>25%</option>
            <option value={30}>30%</option>
            <option value={35}>35%</option>
            <option value={40}>40%</option>
            <option value={45}>45%</option>
          </select>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
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
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(precoMedio)}</p>
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

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Abaixo do sugerido
            </p>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{abaixoSugestao}</p>
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
            onClick={() => alert('Na próxima etapa eu adiciono o formulário premium de produto com precificação automática.')}
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
                  <p className="text-xs text-slate-500 dark:text-slate-400">Preço atual</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {fmt(produto.preco)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Preço sugerido</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {fmt(produto.precoSugerido)}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Custo estimado</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                    {fmt(produto.custoUnitarioEstimado)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Margem atual</p>
                  <p className={`mt-1 font-semibold ${
                    produto.margemAtualCalculada >= margemAlvo
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : produto.margemAtualCalculada >= 10
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {produto.margemAtualCalculada.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Variações / Materiais
                </p>

                <div className="flex flex-wrap gap-2">
                  {produto.variacoes.length > 0 ? (
                    produto.variacoes.slice(0, 4).map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Tag className="mr-1 h-3 w-3" />
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Sem ficha técnica cadastrada
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="flex items-center gap-2">
                  <BadgeDollarSign className="h-4 w-4 text-sky-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Precificação
                  </p>
                </div>

                {produto.alertaPreco === 'sem_ficha' ? (
                  <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                    Produto sem ficha técnica. Não dá para sugerir preço com precisão.
                  </p>
                ) : produto.alertaPreco === 'baixo' ? (
                  <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">
                    Preço atual abaixo do sugerido para a margem alvo de {margemAlvo}%.
                  </p>
                ) : (
                  <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    Preço atual compatível com a margem alvo definida.
                  </p>
                )}
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
          <div className="relative z-10 w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Preço atual
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.preco)}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Custo estimado
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.custoUnitarioEstimado)}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Preço sugerido
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.precoSugerido)}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Margem atual
                </p>
                <p className={`mt-2 text-base font-semibold ${
                  selected.margemAtualCalculada >= margemAlvo
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : selected.margemAtualCalculada >= 10
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {selected.margemAtualCalculada.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="erp-card p-4">
                <div className="flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-sky-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Matéria-prima
                  </p>
                </div>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.costBreakdown.material)}
                </p>
              </div>

              <div className="erp-card p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-violet-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Impressão
                  </p>
                </div>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.costBreakdown.impressao)}
                </p>
              </div>

              <div className="erp-card p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Acabamento
                  </p>
                </div>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.costBreakdown.acabamento)}
                </p>
              </div>

              <div className="erp-card p-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Operacional
                  </p>
                </div>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.costBreakdown.operacional)}
                </p>
              </div>
            </div>

            <div className="mt-4 erp-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <BadgeDollarSign className="h-4 w-4 text-sky-500" />
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Leitura comercial
                </p>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-200">
                Com margem alvo de <span className="font-semibold">{margemAlvo}%</span>, o preço sugerido para este produto é{' '}
                <span className="font-semibold">{fmt(selected.precoSugerido)}</span>. O preço atual é{' '}
                <span className="font-semibold">{fmt(selected.preco)}</span>.
              </p>
            </div>

            <div className="mt-4 erp-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Variações / Materiais
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selected.variacoes.length > 0 ? (
                  selected.variacoes.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Sem ficha técnica cadastrada.
                  </span>
                )}
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
                    onClick={() => alert('Esse produto ainda precisa de ficha técnica para integrar com produção e precificação automática.')}
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
