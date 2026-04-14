'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart,
  AlertTriangle,
  Factory,
  CircleDollarSign,
  Boxes,
  Search,
  BadgeAlert,
  PackagePlus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

type OrdemProducao = {
  id: string;
  pedido_id?: string | null;
  pedido_numero: string;
  cliente_nome?: string | null;
  produto?: string | null;
  quantidade?: number | null;
  status:
    | 'Aguardando material'
    | 'Pronta para produção'
    | 'Em produção'
    | 'Pausada'
    | 'Finalizada';
};

type FichaTecnicaItem = {
  id: string;
  produto_nome: string;
  material_nome: string;
  quantidade: number;
  unidade: string;
};

type SugestaoCompra = {
  material: string;
  categoria: string;
  fornecedor: string;
  unidade: string;
  estoqueAtual: number;
  estoqueMinimo: number;
  necessidadeProducao: number;
  quantidadeSugerida: number;
  custoEstimado: number;
  produtosRelacionados: string[];
  criticidade: 'Alta' | 'Média';
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);

function normalizeText(value: string) {
  return (value || '').toLowerCase().trim();
}

export default function ComprasPage() {
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [ficha, setFicha] = useState<FichaTecnicaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  async function fetchData() {
    try {
      setLoading(true);
      setError('');

      const [estoqueRes, ordensRes, fichaRes] = await Promise.all([
        supabase.from('estoque').select('*').order('item', { ascending: true }),
        supabase.from('ordens_producao').select('*').order('created_at', { ascending: false }),
        supabase.from('ficha_tecnica').select('*'),
      ]);

      if (estoqueRes.error) throw estoqueRes.error;
      if (ordensRes.error) throw ordensRes.error;
      if (fichaRes.error) throw fichaRes.error;

      setEstoque((estoqueRes.data as EstoqueItem[]) || []);
      setOrdens((ordensRes.data as OrdemProducao[]) || []);
      setFicha((fichaRes.data as FichaTecnicaItem[]) || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao carregar compras');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const sugestoes = useMemo<SugestaoCompra[]>(() => {
    const abertas = ordens.filter((op) =>
      ['Aguardando material', 'Pronta para produção', 'Em produção', 'Pausada'].includes(op.status)
    );

    const consumoMap = new Map<
      string,
      {
        necessidade: number;
        produtos: Set<string>;
      }
    >();

    abertas.forEach((ordem) => {
      const produtoNome = ordem.produto || '';
      const quantidadeOrdem = Number(ordem.quantidade || 0);

      const itensFicha = ficha.filter(
        (f) => normalizeText(f.produto_nome) === normalizeText(produtoNome)
      );

      itensFicha.forEach((item) => {
        const key = normalizeText(item.material_nome);
        const atual = consumoMap.get(key) || {
          necessidade: 0,
          produtos: new Set<string>(),
        };

        atual.necessidade += Number(item.quantidade || 0) * quantidadeOrdem;
        atual.produtos.add(produtoNome);

        consumoMap.set(key, atual);
      });
    });

    const listaSugestoes: SugestaoCompra[] = [];

    estoque.forEach((item) => {
      const consumo = consumoMap.get(normalizeText(item.item));
      const necessidadeProducao = Number(consumo?.necessidade || 0);
      const estoqueAtual = Number(item.quantidade || 0);
      const estoqueMinimo = Number(item.estoque_minimo || 0);

      const saldoProjetado = estoqueAtual - necessidadeProducao;
      const precisaComprar =
        saldoProjetado < estoqueMinimo || estoqueAtual < estoqueMinimo || necessidadeProducao > 0;

      if (!precisaComprar) return;

      const quantidadeSugerida = Math.max(estoqueMinimo + necessidadeProducao - estoqueAtual, 0);
      if (quantidadeSugerida <= 0) return;

      const criticidade: 'Alta' | 'Média' =
        estoqueAtual <= 0 || saldoProjetado < 0 ? 'Alta' : 'Média';

      listaSugestoes.push({
        material: item.item,
        categoria: item.categoria,
        fornecedor: item.fornecedor || 'Não informado',
        unidade: item.unidade,
        estoqueAtual,
        estoqueMinimo,
        necessidadeProducao,
        quantidadeSugerida: Number(quantidadeSugerida.toFixed(2)),
        custoEstimado: Number((quantidadeSugerida * Number(item.valor_unitario || 0)).toFixed(2)),
        produtosRelacionados: Array.from(consumo?.produtos || []),
        criticidade,
      });
    });

    return listaSugestoes.sort((a, b) => {
      if (a.criticidade !== b.criticidade) {
        return a.criticidade === 'Alta' ? -1 : 1;
      }
      return b.custoEstimado - a.custoEstimado;
    });
  }, [estoque, ordens, ficha]);

  const filtradas = useMemo(() => {
    return sugestoes.filter((item) => {
      const termo = search.toLowerCase();
      return (
        item.material.toLowerCase().includes(termo) ||
        item.categoria.toLowerCase().includes(termo) ||
        item.fornecedor.toLowerCase().includes(termo) ||
        item.produtosRelacionados.some((p) => p.toLowerCase().includes(termo))
      );
    });
  }, [sugestoes, search]);

  const resumo = useMemo(() => {
    const totalItens = sugestoes.length;
    const criticos = sugestoes.filter((s) => s.criticidade === 'Alta').length;
    const ligadosProducao = sugestoes.filter((s) => s.necessidadeProducao > 0).length;
    const custoTotal = sugestoes.reduce((sum, s) => sum + s.custoEstimado, 0);

    return {
      totalItens,
      criticos,
      ligadosProducao,
      custoTotal,
    };
  }, [sugestoes]);

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
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Itens para compra
            </p>
            <ShoppingCart className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.totalItens}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Criticidade alta
            </p>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.criticos}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ligados à produção
            </p>
            <Factory className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.ligadosProducao}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Custo estimado
            </p>
            <CircleDollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(resumo.custoTotal)}</p>
        </div>
      </section>

      <section className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar material, fornecedor ou produto relacionado..."
              className="erp-input w-96 pl-10"
            />
          </div>

          <div className="inline-flex items-center rounded-2xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            <PackagePlus className="mr-2 h-4 w-4" />
            Sugestão automática de compra
          </div>
        </div>

        <div className="grid gap-4 p-5">
          {filtradas.length > 0 ? (
            filtradas.map((item, index) => (
              <div
                key={`${item.material}-${index}`}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {item.categoria}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {item.material}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Fornecedor: {item.fornecedor}
                    </p>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.criticidade === 'Alta'
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                    }`}
                  >
                    {item.criticidade}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Estoque atual</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {item.estoqueAtual} {item.unidade}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Estoque mínimo</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {item.estoqueMinimo} {item.unidade}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Necessidade produção</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {item.necessidadeProducao} {item.unidade}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Comprar</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {item.quantidadeSugerida} {item.unidade}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Custo estimado</p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {fmt(item.custoEstimado)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                  <div className="mb-2 flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-sky-500" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Produtos relacionados
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {item.produtosRelacionados.length > 0 ? (
                      item.produtosRelacionados.map((produto) => (
                        <span
                          key={produto}
                          className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {produto}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        Sem vínculo direto com ordem aberta.
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                  <div className="flex items-center gap-2">
                    <BadgeAlert className="h-4 w-4 text-amber-500" />
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Sugestão baseada em estoque mínimo + produção em aberto.
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Nenhuma sugestão de compra encontrada.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
