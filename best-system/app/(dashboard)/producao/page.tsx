'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Factory,
  Boxes,
  CheckCircle2,
  Search,
  ShieldAlert,
  Layers3,
  PlayCircle,
  PauseCircle,
  CircleDollarSign,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type OrdemStatus =
  | 'Aguardando material'
  | 'Pronta para produção'
  | 'Em produção'
  | 'Pausada'
  | 'Finalizada';

type OrdemProducao = {
  id: string;
  pedido_id?: string | null;
  pedido_numero: string;
  cliente_nome?: string | null;
  produto?: string | null;
  quantidade?: number | null;
  status: OrdemStatus;
  prazo?: string | null;
  progresso?: number | null;
  materiais_ok?: boolean | null;
  custo_previsto?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
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
  created_at?: string;
  updated_at?: string;
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const statusConfig: Record<OrdemStatus, string> = {
  'Aguardando material': 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  'Pronta para produção': 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300',
  'Em produção': 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  Pausada: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Finalizada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
};

export default function ProducaoPage() {
  const [search, setSearch] = useState('');
  const [lista, setLista] = useState<OrdemProducao[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState<'Todos' | OrdemStatus>('Todos');
  const [error, setError] = useState('');

  async function calcularCustoPrevisto(
    produtoNome: string,
    quantidadeProducao: number,
    ficha: FichaTecnicaItem[],
    estoque: EstoqueItem[]
  ) {
    const materiais = ficha.filter((f) => f.produto_nome === produtoNome);

    if (!materiais.length) {
      return 0;
    }

    let custoTotal = 0;

    for (const material of materiais) {
      const itemEstoque = estoque.find(
        (e) => e.item.toLowerCase() === material.material_nome.toLowerCase()
      );

      if (!itemEstoque) continue;

      const consumoTotal = Number(material.quantidade || 0) * Number(quantidadeProducao || 0);
      const custoMaterial = consumoTotal * Number(itemEstoque.valor_unitario || 0);

      custoTotal += custoMaterial;
    }

    return Number(custoTotal.toFixed(2));
  }

  async function fetchOrdens() {
    try {
      setLoading(true);
      setError('');

      const { data: ordens, error: ordensError } = await supabase
        .from('ordens_producao')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordensError) throw ordensError;

      const { data: ficha, error: fichaError } = await supabase
        .from('ficha_tecnica')
        .select('*');

      if (fichaError) throw fichaError;

      const { data: estoque, error: estoqueError } = await supabase
        .from('estoque')
        .select('*');

      if (estoqueError) throw estoqueError;

      const ordensBase = (ordens as OrdemProducao[]) || [];
      const fichaBase = (ficha as FichaTecnicaItem[]) || [];
      const estoqueBase = (estoque as EstoqueItem[]) || [];

      const ordensAtualizadas: OrdemProducao[] = [];

      for (const op of ordensBase) {
        const materiais = fichaBase.filter((f) => f.produto_nome === op.produto);

        let materiais_ok = true;

        for (const mat of materiais) {
          const itemEstoque = estoqueBase.find(
            (e) => e.item.toLowerCase() === mat.material_nome.toLowerCase()
          );

          if (!itemEstoque || Number(itemEstoque.quantidade) < Number(mat.quantidade) * Number(op.quantidade || 0)) {
            materiais_ok = false;
          }
        }

        const custo_previsto = await calcularCustoPrevisto(
          op.produto || '',
          Number(op.quantidade || 0),
          fichaBase,
          estoqueBase
        );

        const ordemAtualizada = {
          ...op,
          materiais_ok,
          custo_previsto,
        };

        ordensAtualizadas.push(ordemAtualizada);

        await supabase
          .from('ordens_producao')
          .update({
            materiais_ok,
            custo_previsto,
            updated_at: new Date().toISOString(),
          })
          .eq('id', op.id);
      }

      setLista(ordensAtualizadas);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao validar produção');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrdens();
  }, []);

  const filtered = useMemo(() => {
    return lista.filter((op) => {
      const matchSearch =
        (op.pedido_numero || '').toLowerCase().includes(search.toLowerCase()) ||
        (op.cliente_nome || '').toLowerCase().includes(search.toLowerCase()) ||
        (op.produto || '').toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFiltro === 'Todos' || op.status === statusFiltro;
      return matchSearch && matchStatus;
    });
  }, [lista, search, statusFiltro]);

  async function updateStatus(op: OrdemProducao, status: OrdemStatus, progresso?: number) {
    try {
      const { error } = await supabase
        .from('ordens_producao')
        .update({
          status,
          progresso:
            progresso !== undefined
              ? progresso
              : status === 'Finalizada'
              ? 100
              : op.progresso || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', op.id);

      if (error) throw error;

      if (op.pedido_id) {
        const pedidoStatus =
          status === 'Finalizada'
            ? 'Pronto'
            : status === 'Em produção'
            ? 'Em Produção'
            : 'Em Andamento';

        await supabase
          .from('pedidos')
          .update({
            status: pedidoStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', op.pedido_id);
      }

      fetchOrdens();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao atualizar produção');
    }
  }

  async function iniciarProducao(op: OrdemProducao) {
    try {
      const { data: ficha, error: fichaError } = await supabase
        .from('ficha_tecnica')
        .select('*')
        .eq('produto_nome', op.produto || '');

      if (fichaError) throw fichaError;

      const { data: estoque, error: estoqueError } = await supabase
        .from('estoque')
        .select('*');

      if (estoqueError) throw estoqueError;

      const materiais = (ficha as FichaTecnicaItem[]) || [];
      const estoqueBase = (estoque as EstoqueItem[]) || [];

      if (!materiais.length) {
        alert('Produto sem ficha técnica.');
        return;
      }

      let podeProduzir = true;

      for (const item of materiais) {
        const est = estoqueBase.find(
          (e) => e.item.toLowerCase() === item.material_nome.toLowerCase()
        );

        if (!est || Number(est.quantidade) < Number(item.quantidade) * Number(op.quantidade || 0)) {
          podeProduzir = false;
        }
      }

      if (!podeProduzir) {
        alert('Sem material suficiente para iniciar produção.');
        return;
      }

      for (const item of materiais) {
        const est = estoqueBase.find(
          (e) => e.item.toLowerCase() === item.material_nome.toLowerCase()
        );

        if (!est) continue;

        const novaQtd =
          Number(est.quantidade) - Number(item.quantidade) * Number(op.quantidade || 0);

        await supabase
          .from('estoque')
          .update({
            quantidade: novaQtd,
            updated_at: new Date().toISOString(),
          })
          .eq('id', est.id);
      }

      await updateStatus(op, 'Em produção', Math.max(Number(op.progresso || 0), 10));
      alert('Produção iniciada e estoque atualizado com sucesso.');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao iniciar produção');
    }
  }

  const stats = {
    aguardando: lista.filter((i) => i.status === 'Aguardando material').length,
    prontas: lista.filter((i) => i.status === 'Pronta para produção').length,
    producao: lista.filter((i) => i.status === 'Em produção').length,
    finalizadas: lista.filter((i) => i.status === 'Finalizada').length,
    custoTotal: lista.reduce((sum, i) => sum + Number(i.custo_previsto || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Aguardando material
            </p>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.aguardando}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Prontas
            </p>
            <Boxes className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.prontas}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Em produção
            </p>
            <Factory className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.producao}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Finalizadas
            </p>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.finalizadas}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Custo previsto total
            </p>
            <CircleDollarSign className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(stats.custoTotal)}</p>
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
            Produção ativa
          </button>
        </div>

        {error ? (
          <div className="p-6 text-sm text-red-600 dark:text-red-400">
            Erro ao carregar produção: {error}
          </div>
        ) : (
          <div className="grid gap-4 p-5 lg:grid-cols-2">
            {filtered.map((op) => (
              <div key={op.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {op.pedido_numero}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {op.produto || 'Sem produto'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {op.cliente_nome || 'Sem cliente'}
                    </p>
                  </div>

                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig[op.status]}`}>
                    {op.status}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Quantidade</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                      {Number(op.quantidade || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Prazo</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                      {op.prazo ? new Date(`${op.prazo}T00:00:00`).toLocaleDateString('pt-BR') : '—'}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Custo previsto</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                      {fmt(Number(op.custo_previsto || 0))}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Custo unit.</p>
                    <p className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                      {Number(op.quantidade || 0) > 0
                        ? fmt(Number(op.custo_previsto || 0) / Number(op.quantidade || 0))
                        : fmt(0)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                    <span>Progresso</span>
                    <span>{Number(op.progresso || 0)}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 transition-all"
                      style={{ width: `${Number(op.progresso || 0)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Materiais
                  </p>
                  <p className={`mt-2 text-sm font-medium ${op.materiais_ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {op.materiais_ok ? 'Estoque validado e liberado para produção' : 'Validação de materiais pendente'}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/70">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-sky-500" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      Gestão
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Essa ordem já calcula custo previsto com base na ficha técnica e no valor unitário do estoque.
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => iniciarProducao(op)}
                    className="erp-button-primary px-3 py-2 text-xs"
                  >
                    <PlayCircle className="mr-1.5 h-4 w-4" />
                    Iniciar
                  </button>

                  <button
                    onClick={() => updateStatus(op, 'Pausada')}
                    className="erp-button-secondary px-3 py-2 text-xs"
                  >
                    <PauseCircle className="mr-1.5 h-4 w-4" />
                    Pausar
                  </button>

                  <button
                    onClick={() => updateStatus(op, 'Finalizada', 100)}
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
                Nenhuma ordem de produção encontrada.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
