'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  CircleDollarSign,
  Factory,
  AlertTriangle,
  PackageCheck,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type PedidoRow = {
  id: string;
  numero?: string | null;
  cliente_nome?: string | null;
  produto?: string | null;
  quantidade?: number | null;
  valor?: number | null;
  status?: string | null;
  prazo?: string | null;
};

type OrdemProducaoRow = {
  id: string;
  pedido_id?: string | null;
  produto?: string | null;
  quantidade?: number | null;
  custo_previsto?: number | null;
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

type PedidoGerencial = {
  id: string;
  numero: string;
  cliente: string;
  produto: string;
  valorVenda: number;
  custoTotal: number;
  lucro: number;
  margem: number;
  status: string;
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);

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
  const materiais = ficha.filter(
    (f) => normalizeText(f.produto_nome) === normalizeText(produtoNome)
  );

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

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [ordens, setOrdens] = useState<OrdemProducaoRow[]>([]);
  const [ficha, setFicha] = useState<FichaTecnicaItem[]>([]);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchData() {
    try {
      setLoading(true);
      setError('');

      const [pedidosRes, ordensRes, fichaRes, estoqueRes] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
        supabase.from('ordens_producao').select('*').order('created_at', { ascending: false }),
        supabase.from('ficha_tecnica').select('*'),
        supabase.from('estoque').select('*'),
      ]);

      if (pedidosRes.error) throw pedidosRes.error;
      if (ordensRes.error) throw ordensRes.error;
      if (fichaRes.error) throw fichaRes.error;
      if (estoqueRes.error) throw estoqueRes.error;

      setPedidos((pedidosRes.data as PedidoRow[]) || []);
      setOrdens((ordensRes.data as OrdemProducaoRow[]) || []);
      setFicha((fichaRes.data as FichaTecnicaItem[]) || []);
      setEstoque((estoqueRes.data as EstoqueItem[]) || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const pedidosGerenciais = useMemo<PedidoGerencial[]>(() => {
    return pedidos.map((pedido) => {
      const ordem = ordens.find((o) => o.pedido_id === pedido.id);

      const breakdown = buildCostBreakdown(
        ordem?.produto || pedido.produto || '',
        Number(ordem?.quantidade || pedido.quantidade || 0),
        ficha,
        estoque
      );

      const valorVenda = Number(pedido.valor || 0);
      const custoTotal = Number(breakdown.total || 0);
      const lucro = valorVenda - custoTotal;
      const margem = valorVenda > 0 ? (lucro / valorVenda) * 100 : 0;

      return {
        id: pedido.id || '',
        numero: pedido.numero || '—',
        cliente: pedido.cliente_nome || '—',
        produto: pedido.produto || '—',
        valorVenda,
        custoTotal,
        lucro,
        margem,
        status: pedido.status || 'Aguardando',
      };
    });
  }, [pedidos, ordens, ficha, estoque]);

  const resumo = useMemo(() => {
    const faturamento = pedidosGerenciais.reduce((sum, p) => sum + p.valorVenda, 0);
    const custos = pedidosGerenciais.reduce((sum, p) => sum + p.custoTotal, 0);
    const lucro = pedidosGerenciais.reduce((sum, p) => sum + p.lucro, 0);
    const margemMedia = faturamento > 0 ? (lucro / faturamento) * 100 : 0;

    const emProducao = pedidosGerenciais.filter((p) => p.status === 'Em Produção').length;
    const concluidos = pedidosGerenciais.filter((p) =>
      ['Pronto', 'Entregue'].includes(p.status)
    ).length;

    const margemBaixa = pedidosGerenciais.filter((p) => p.margem < 10).length;

    return {
      faturamento,
      custos,
      lucro,
      margemMedia,
      emProducao,
      concluidos,
      margemBaixa,
    };
  }, [pedidosGerenciais]);

  const topProdutos = useMemo(() => {
    const map = new Map<
      string,
      { produto: string; faturamento: number; custo: number; lucro: number; qtd: number }
    >();

    pedidosGerenciais.forEach((item) => {
      const atual = map.get(item.produto) || {
        produto: item.produto,
        faturamento: 0,
        custo: 0,
        lucro: 0,
        qtd: 0,
      };

      atual.faturamento += item.valorVenda;
      atual.custo += item.custoTotal;
      atual.lucro += item.lucro;
      atual.qtd += 1;

      map.set(item.produto, atual);
    });

    return Array.from(map.values()).sort((a, b) => b.lucro - a.lucro).slice(0, 5);
  }, [pedidosGerenciais]);

  const alertasMargem = useMemo(() => {
    return pedidosGerenciais
      .filter((p) => p.margem < 10)
      .sort((a, b) => a.margem - b.margem)
      .slice(0, 5);
  }, [pedidosGerenciais]);

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
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Faturamento
            </p>
            <Wallet className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(resumo.faturamento)}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Custos
            </p>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(resumo.custos)}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Lucro
            </p>
            <CircleDollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className={`text-2xl font-bold ${resumo.lucro >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {fmt(resumo.lucro)}
          </p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Margem média
            </p>
            <TrendingUp className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{resumo.margemMedia.toFixed(1)}%</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Em produção
            </p>
            <Factory className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{resumo.emProducao}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Margem baixa
            </p>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{resumo.margemBaixa}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="erp-card p-5">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-sky-500" />
            <div>
              <h2 className="erp-section-title">Pedidos com menor margem</h2>
              <p className="erp-section-subtitle">Os pedidos que merecem sua atenção primeiro</p>
            </div>
          </div>

          <div className="space-y-3">
            {alertasMargem.length > 0 ? (
              alertasMargem.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.numero} — {item.produto}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {item.cliente}
                      </p>
                    </div>

                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.margem >= 10
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                    }`}>
                      {item.margem.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Venda</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{fmt(item.valorVenda)}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Custo</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{fmt(item.custoTotal)}</p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Lucro</p>
                      <p className={`mt-1 font-semibold ${item.lucro >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {fmt(item.lucro)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Nenhum pedido com margem baixa no momento.
              </div>
            )}
          </div>
        </div>

        <div className="erp-card p-5">
          <div className="mb-5 flex items-center gap-2">
            <PackageCheck className="h-5 w-5 text-emerald-500" />
            <div>
              <h2 className="erp-section-title">Top produtos por lucro</h2>
              <p className="erp-section-subtitle">Os produtos que mais deixam resultado</p>
            </div>
          </div>

          <div className="space-y-3">
            {topProdutos.length > 0 ? (
              topProdutos.map((produto, index) => {
                const margem = produto.faturamento > 0 ? (produto.lucro / produto.faturamento) * 100 : 0;

                return (
                  <div
                    key={`${produto.produto}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{produto.produto}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {produto.qtd} pedido(s)
                        </p>
                      </div>

                      <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                        {margem.toFixed(1)}%
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Faturamento</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">{fmt(produto.faturamento)}</p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Custo</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">{fmt(produto.custo)}</p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Lucro</p>
                        <p className="mt-1 font-semibold text-emerald-600 dark:text-emerald-400">{fmt(produto.lucro)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Ainda não há dados suficientes para ranking.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
