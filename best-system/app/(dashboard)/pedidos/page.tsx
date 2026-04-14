'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Clock3,
  Factory,
  PackageCheck,
  CircleAlert,
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
  observacoes?: string | null;
  created_at?: string | null;
};

const statusStyles: Record<string, string> = {
  Aguardando: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  'Em Andamento': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  'Em Produção': 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  Pronto: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  Entregue: 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300',
  Cancelado: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Atrasado: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

function getStatus(pedido: PedidoRow) {
  if (!pedido.prazo) return pedido.status || 'Aguardando';

  const status = pedido.status || 'Aguardando';
  if (status === 'Entregue' || status === 'Cancelado') return status;

  const prazo = new Date(`${pedido.prazo}T23:59:59`);
  if (prazo < new Date()) return 'Atrasado';

  return status;
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<PedidoRow | null>(null);
  const [error, setError] = useState('');

  async function fetchPedidos() {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('pedidos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPedidos((data as PedidoRow[]) || []);
    } catch (err: any) {
      console.error('Erro ao carregar pedidos:', err);
      setError(err?.message || 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPedidos();
  }, []);

  const filtered = useMemo(() => {
    return pedidos.filter((pedido) => {
      const numero = pedido.numero || '';
      const cliente = pedido.cliente_nome || '';
      const produto = pedido.produto || '';

      return (
        numero.toLowerCase().includes(search.toLowerCase()) ||
        cliente.toLowerCase().includes(search.toLowerCase()) ||
        produto.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [pedidos, search]);

  const stats = useMemo(() => {
    const ativos = pedidos.filter(
      (p) => !['Entregue', 'Cancelado'].includes(p.status || '')
    ).length;

    const producao = pedidos.filter(
      (p) => (p.status || '') === 'Em Produção'
    ).length;

    const prontos = pedidos.filter((p) =>
      ['Pronto', 'Entregue'].includes(p.status || '')
    ).length;

    const valorAberto = pedidos
      .filter((p) => !['Entregue', 'Cancelado'].includes(p.status || ''))
      .reduce((acc, p) => acc + Number(p.valor || 0), 0);

    return {
      ativos,
      producao,
      prontos,
      valorAberto,
    };
  }, [pedidos]);

  async function handleDelete(id: string) {
    const confirmar = window.confirm('Deseja realmente excluir este pedido?');
    if (!confirmar) return;

    try {
      const { error } = await supabase.from('pedidos').delete().eq('id', id);
      if (error) throw error;
      fetchPedidos();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao excluir pedido');
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      fetchPedidos();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao atualizar status');
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Pedidos ativos
            </p>
            <Clock3 className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats.ativos}
          </p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Em produção
            </p>
            <Factory className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats.producao}
          </p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Prontos / entregues
            </p>
            <PackageCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">
            {stats.prontos}
          </p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Valor em aberto
            </p>
            <CircleAlert className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(stats.valorAberto)}
          </p>
        </div>
      </section>

      <section className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pedido, cliente ou produto..."
              className="erp-input w-80 pl-10"
            />
          </div>

          <button
            type="button"
            className="erp-button-primary"
            onClick={() =>
              alert('Na próxima etapa eu adiciono o formulário premium de novo pedido.')
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </button>
        </div>

        {error ? (
          <div className="p-6 text-sm text-red-600 dark:text-red-400">
            Erro ao carregar pedidos: {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60">
                  {[
                    'Pedido',
                    'Cliente',
                    'Produto',
                    'Qtd',
                    'Valor',
                    'Status',
                    'Prazo',
                    'Ações',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((pedido) => {
                  const status = getStatus(pedido);
                  const statusClass =
                    statusStyles[status] ||
                    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

                  return (
                    <tr
                      key={pedido.id}
                      className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="px-4 py-3 font-mono font-semibold text-sky-600 dark:text-sky-400">
                        {pedido.numero || '—'}
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">
                        {pedido.cliente_nome || '—'}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {pedido.produto || '—'}
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {Number(pedido.quantidade || 0).toLocaleString('pt-BR')}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(Number(pedido.valor || 0))}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {pedido.prazo
                          ? new Date(`${pedido.prazo}T00:00:00`).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedPedido(pedido)}
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              alert('Na próxima etapa eu adiciono a edição premium do pedido.')
                            }
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <select
                            value={pedido.status || 'Aguardando'}
                            onChange={(e) =>
                              handleUpdateStatus(pedido.id, e.target.value)
                            }
                            className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                          >
                            <option>Aguardando</option>
                            <option>Em Andamento</option>
                            <option>Em Produção</option>
                            <option>Pronto</option>
                            <option>Entregue</option>
                            <option>Cancelado</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleDelete(pedido.id)}
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
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      Nenhum pedido encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedPedido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedPedido(null)}
          />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Pedido
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedPedido.numero || '—'}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selectedPedido.cliente_nome || '—'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPedido(null)}
                className="erp-button-secondary px-3 py-2 text-xs"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Produto
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {selectedPedido.produto || '—'}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Quantidade:{' '}
                  {Number(selectedPedido.quantidade || 0).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Financeiro
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(Number(selectedPedido.valor || 0))}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Prazo:{' '}
                  {selectedPedido.prazo
                    ? new Date(`${selectedPedido.prazo}T00:00:00`).toLocaleDateString('pt-BR')
                    : 'Não informado'}
                </p>
              </div>
            </div>

            <div className="mt-4 erp-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Observações
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                {selectedPedido.observacoes?.trim() || 'Sem observações cadastradas.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
