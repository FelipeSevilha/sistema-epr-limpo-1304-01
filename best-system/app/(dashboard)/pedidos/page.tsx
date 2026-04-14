'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  FileText,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  TriangleAlert as AlertTriangle,
  Factory,
  PackageCheck,
  Clock3,
  CheckCircle2,
} from 'lucide-react';
import { supabase, Pedido } from '@/lib/supabase';
import PedidoForm from '@/components/pedidos/PedidoForm';
import { gerarPedidoPDF } from '@/components/pedidos/pedidoPDF';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const ALL_STATUSES = [
  'Aguardando',
  'Em Andamento',
  'Em Produção',
  'Em Acabamento',
  'Pronto',
  'Entregue',
  'Atrasado',
  'Cancelado',
];

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  Aguardando: { bg: 'bg-amber-100 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-400' },
  'Em Andamento': { bg: 'bg-blue-100 dark:bg-blue-500/10', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-400' },
  'Em Produção': { bg: 'bg-violet-100 dark:bg-violet-500/10', text: 'text-violet-700 dark:text-violet-300', dot: 'bg-violet-400' },
  'Em Acabamento': { bg: 'bg-sky-100 dark:bg-sky-500/10', text: 'text-sky-700 dark:text-sky-300', dot: 'bg-sky-400' },
  Pronto: { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-400' },
  Entregue: { bg: 'bg-teal-100 dark:bg-teal-500/10', text: 'text-teal-700 dark:text-teal-300', dot: 'bg-teal-400' },
  Atrasado: { bg: 'bg-red-100 dark:bg-red-500/10', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-400' },
  Cancelado: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' },
};

const FILTER_TABS = ['Todos', 'Aguardando', 'Em Andamento', 'Em Produção', 'Em Acabamento', 'Pronto', 'Entregue', 'Atrasado', 'Cancelado'];

function isAtrasado(pedido: Pedido): boolean {
  if (!pedido.prazo) return false;
  if (['Entregue', 'Cancelado'].includes(pedido.status)) return false;
  return new Date(pedido.prazo + 'T23:59:59') < new Date();
}

function getEffectiveStatus(pedido: Pedido) {
  return isAtrasado(pedido) ? 'Atrasado' : pedido.status;
}

export default function PedidosPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [lista, setLista] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPedido, setEditingPedido] = useState<Pedido | null>(null);
  const [detailPedido, setDetailPedido] = useState<Pedido | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const fetchPedidos = useCallback(async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) setLista(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPedidos();

    const channel = supabase
      .channel('pedidos_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, fetchPedidos)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPedidos]);

  useEffect(() => {
    const close = () => setActionMenuId(null);
    if (actionMenuId) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [actionMenuId]);

  const filtered = useMemo(() => {
    return lista.filter((p) => {
      const matchSearch =
        p.cliente_nome.toLowerCase().includes(search.toLowerCase()) ||
        p.numero.toLowerCase().includes(search.toLowerCase()) ||
        (p.produto ?? '').toLowerCase().includes(search.toLowerCase());

      const effectiveStatus = getEffectiveStatus(p);
      const matchStatus = filterStatus === 'Todos' || effectiveStatus === filterStatus;

      return matchSearch && matchStatus;
    });
  }, [lista, search, filterStatus]);

  const counts = useMemo(() => {
    return FILTER_TABS.slice(1).reduce((acc, s) => {
      acc[s] = lista.filter((p) => getEffectiveStatus(p) === s).length;
      return acc;
    }, {} as Record<string, number>);
  }, [lista]);

  const totalEmAberto = filtered
    .filter((p) => !['Entregue', 'Cancelado'].includes(p.status))
    .reduce((sum, p) => sum + p.valor, 0);

  const handleDelete = async (id: string) => {
    await supabase.from('pedidos').delete().eq('id', id);
    setDeleteConfirm(null);
  };

  const handleUpdateStatus = async (id: string, novoStatus: string) => {
    await supabase.from('pedidos').update({ status: novoStatus, updated_at: new Date().toISOString() }).eq('id', id);
  };

  const handleEdit = (p: Pedido) => {
    setEditingPedido(p);
    setFormOpen(true);
    setActionMenuId(null);
  };

  const handleSave = async (data: Omit<Pedido, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingPedido) {
      await supabase
        .from('pedidos')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', editingPedido.id);
    } else {
      await supabase.from('pedidos').insert(data);
    }

    setFormOpen(false);
    setEditingPedido(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Pedidos ativos</p>
            <Clock3 className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {lista.filter((p) => !['Entregue', 'Cancelado'].includes(p.status)).length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Em acompanhamento comercial e operacional</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Em produção</p>
            <Factory className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {lista.filter((p) => p.status === 'Em Produção').length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pedidos já liberados para a fábrica</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Prontos / entrega</p>
            <PackageCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {lista.filter((p) => ['Pronto', 'Entregue'].includes(p.status)).length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Pedidos já concluídos ou aguardando saída</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Valor em aberto</p>
            <CheckCircle2 className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{fmt(totalEmAberto)}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Baseado no filtro atual da listagem</p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 lg:grid-cols-4 xl:grid-cols-8">
        {FILTER_TABS.slice(1).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const isActive = filterStatus === s;

          return (
            <button
              key={s}
              onClick={() => setFilterStatus(filterStatus === s ? 'Todos' : s)}
              className={`rounded-2xl border p-3 text-left transition-all ${
                isActive
                  ? 'border-sky-500 bg-sky-50 dark:border-sky-500/40 dark:bg-sky-500/10'
                  : 'border-slate-200 bg-white hover:border-sky-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500/20'
              }`}
            >
              <div className={`mb-2 h-2 w-2 rounded-full ${cfg?.dot ?? 'bg-slate-400'}`} />
              <p className="text-xs font-medium leading-tight text-slate-500 dark:text-slate-400">{s}</p>
              <p className="mt-0.5 text-2xl font-bold text-slate-900 dark:text-white">{counts[s] ?? 0}</p>
            </button>
          );
        })}
      </section>

      <section className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar pedido, cliente ou produto..."
                className="erp-input w-72 pl-10"
              />
            </div>

            {filterStatus !== 'Todos' && (
              <button
                onClick={() => setFilterStatus('Todos')}
                className="erp-button-secondary h-11 px-3 py-0 text-xs"
              >
                <Filter className="mr-1 h-3.5 w-3.5" />
                {filterStatus} ×
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setEditingPedido(null);
              setFormOpen(true);
            }}
            className="erp-button-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60">
                {['Pedido', 'Cliente', 'Produto', 'Qtd', 'Valor', 'Orçamento', 'Status', 'Prazo', 'Ações'].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((p) => {
                const effectiveStatus = getEffectiveStatus(p);
                const cfg = STATUS_CONFIG[effectiveStatus] ?? STATUS_CONFIG.Aguardando;
                const atrasado = effectiveStatus === 'Atrasado';

                return (
                  <tr key={p.id} className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 ${atrasado ? 'bg-red-50/40 dark:bg-red-500/5' : ''}`}>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-mono font-semibold text-sky-600 dark:text-sky-400">{p.numero}</span>
                    </td>

                    <td className="max-w-[170px] truncate px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                      {p.cliente_nome}
                    </td>

                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-500 dark:text-slate-400">
                      {p.produto}
                    </td>

                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-300">
                      {p.quantidade.toLocaleString('pt-BR')}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {fmt(p.valor)}
                    </td>

                    <td className="px-4 py-3">
                      {p.orcamento_numero ? (
                        <span className="rounded-full bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {p.orcamento_numero}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
                        {atrasado && <AlertTriangle className="h-3.5 w-3.5" />}
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {effectiveStatus}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                      {p.prazo ? new Date(p.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailPedido(p)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleEdit(p)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => gerarPedidoPDF(p)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                          title="Gerar PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </button>

                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuId(actionMenuId === p.id ? null : p.id);
                            }}
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                            title="Alterar status"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>

                          {actionMenuId === p.id && (
                            <div
                              className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {ALL_STATUSES.map((status) => (
                                <button
                                  key={status}
                                  onClick={() => {
                                    handleUpdateStatus(p.id, status);
                                    setActionMenuId(null);
                                  }}
                                  className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setDeleteConfirm(p.id)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nenhum pedido encontrado com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <PedidoForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingPedido(null);
        }}
        onSave={handleSave}
        pedido={
          editingPedido
            ? {
                id: editingPedido.id,
                numero: editingPedido.numero,
                cliente_id: editingPedido.cliente_id,
                cliente_nome: editingPedido.cliente_nome,
                orcamento_id: editingPedido.orcamento_id,
                orcamento_numero: editingPedido.orcamento_numero || null,
                produto: editingPedido.produto,
                quantidade: editingPedido.quantidade,
                valor: editingPedido.valor,
                status: editingPedido.status,
                prazo: editingPedido.prazo,
                observacoes: editingPedido.observacoes,
              }
            : null
        }
      />

      {detailPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailPedido(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Pedido</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{detailPedido.numero}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{detailPedido.cliente_nome}</p>
              </div>

              <button
                onClick={() => setDetailPedido(null)}
                className="erp-button-secondary px-3 py-2 text-xs"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Produto</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{detailPedido.produto}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Quantidade: {detailPedido.quantidade.toLocaleString('pt-BR')}</p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Financeiro</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{fmt(detailPedido.valor)}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Prazo: {detailPedido.prazo ? new Date(detailPedido.prazo + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado'}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status atual</p>
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CONFIG[getEffectiveStatus(detailPedido)].bg} ${STATUS_CONFIG[getEffectiveStatus(detailPedido)].text}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[getEffectiveStatus(detailPedido)].dot}`} />
                    {getEffectiveStatus(detailPedido)}
                  </span>
                </div>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Origem</p>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                  {detailPedido.orcamento_numero ? `Convertido do orçamento ${detailPedido.orcamento_numero}` : 'Pedido criado diretamente'}
                </p>
              </div>
            </div>

            <div className="mt-4 erp-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Observações</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                {detailPedido.observacoes?.trim() || 'Sem observações cadastradas.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir pedido</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Essa ação não poderá ser desfeita. Tem certeza que deseja excluir este pedido?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="erp-button-secondary">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
