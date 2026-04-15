'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Building2,
  BadgeDollarSign,
  TrendingUp,
  Users,
  PackageCheck,
  Eye,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Cliente = {
  id: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  contato?: string | null;
  telefone?: string | null;
  email?: string | null;
  cidade?: string | null;
  uf?: string | null;
  ativo?: boolean | null;
};

type Pedido = {
  id: string;
  cliente_nome?: string | null;
  valor?: number | null;
  status?: string | null;
  produto?: string | null;
};

type ClienteView = {
  id: string;
  nome: string;
  contato: string;
  telefone: string;
  email: string;
  cidade: string;
  ativo: boolean;
  pedidos: number;
  faturamento: number;
  ticketMedio: number;
  statusEntrega: number;
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ClienteView | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [cliRes, pedRes] = await Promise.all([
        supabase.from('clientes').select('*').order('razao_social', { ascending: true }),
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
      ]);

      setClientes((cliRes.data as Cliente[]) || []);
      setPedidos((pedRes.data as Pedido[]) || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  const clientesView = useMemo<ClienteView[]>(() => {
    return clientes.map((cliente) => {
      const nome = cliente.razao_social || cliente.nome_fantasia || 'Cliente sem nome';
      const pedidosCliente = pedidos.filter(
        (p) => (p.cliente_nome || '').toLowerCase() === nome.toLowerCase()
      );

      const faturamento = pedidosCliente.reduce((sum, p) => sum + Number(p.valor || 0), 0);
      const ticketMedio = pedidosCliente.length > 0 ? faturamento / pedidosCliente.length : 0;
      const statusEntrega = pedidosCliente.filter((p) =>
        ['Pronto', 'Entregue'].includes(p.status || '')
      ).length;

      return {
        id: cliente.id,
        nome,
        contato: cliente.contato || '—',
        telefone: cliente.telefone || '—',
        email: cliente.email || '—',
        cidade: [cliente.cidade, cliente.uf].filter(Boolean).join(' / ') || '—',
        ativo: Boolean(cliente.ativo),
        pedidos: pedidosCliente.length,
        faturamento,
        ticketMedio,
        statusEntrega,
      };
    });
  }, [clientes, pedidos]);

  const filtrados = useMemo(() => {
    return clientesView
      .filter((cliente) => {
        return (
          cliente.nome.toLowerCase().includes(search.toLowerCase()) ||
          cliente.contato.toLowerCase().includes(search.toLowerCase()) ||
          cliente.email.toLowerCase().includes(search.toLowerCase())
        );
      })
      .sort((a, b) => b.faturamento - a.faturamento);
  }, [clientesView, search]);

  const resumo = useMemo(() => {
    const total = clientesView.length;
    const ativos = clientesView.filter((c) => c.ativo).length;
    const faturamento = clientesView.reduce((sum, c) => sum + c.faturamento, 0);
    const ticketMedio = total > 0 ? faturamento / Math.max(clientesView.reduce((sum, c) => sum + c.pedidos, 0), 1) : 0;

    return { total, ativos, faturamento, ticketMedio };
  }, [clientesView]);

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
              Clientes
            </p>
            <Building2 className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.total}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ativos
            </p>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.ativos}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Faturamento
            </p>
            <BadgeDollarSign className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(resumo.faturamento)}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ticket médio
            </p>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(resumo.ticketMedio)}</p>
        </div>
      </section>

      <section className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, contato ou e-mail..."
              className="erp-input w-80 pl-10"
            />
          </div>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((cliente) => (
            <div
              key={cliente.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {cliente.nome}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {cliente.cidade}
                  </p>
                </div>

                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                    cliente.ativo
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {cliente.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pedidos</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{cliente.pedidos}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Entregues / prontos</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{cliente.statusEntrega}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Faturamento</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{fmt(cliente.faturamento)}</p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ticket médio</p>
                  <p className="mt-1 font-semibold text-slate-900 dark:text-white">{fmt(cliente.ticketMedio)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">Contato:</span> {cliente.contato}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">Telefone:</span> {cliente.telefone}
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">E-mail:</span> {cliente.email}
                </p>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setSelected(cliente)}
                  className="erp-button-secondary px-3 py-2 text-xs"
                >
                  <Eye className="mr-1.5 h-4 w-4" />
                  Ver detalhes
                </button>
              </div>
            </div>
          ))}

          {filtrados.length === 0 && (
            <div className="col-span-full rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Nenhum cliente encontrado.
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
                  Cliente
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {selected.nome}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selected.cidade}
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
                  Pedidos
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {selected.pedidos}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Faturamento
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.faturamento)}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Ticket médio
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.ticketMedio)}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Entregues / prontos
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {selected.statusEntrega}
                </p>
              </div>
            </div>

            <div className="mt-4 erp-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Contatos
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                {selected.contato} • {selected.telefone} • {selected.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
