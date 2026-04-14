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
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);

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

  // 🔥 FUNÇÃO ATUALIZADA COM VALIDAÇÃO DE ESTOQUE + FICHA
  async function fetchOrdens() {
    try {
      setLoading(true);
      setError('');

      const { data: ordens } = await supabase
        .from('ordens_producao')
        .select('*');

      const { data: ficha } = await supabase
        .from('ficha_tecnica')
        .select('*');

      const { data: estoque } = await supabase
        .from('estoque')
        .select('*');

      if (!ordens) return;

      const ordensAtualizadas = ordens.map((op: any) => {
        const materiais = ficha?.filter(
          (f: any) => f.produto_nome === op.produto
        );

        let materiais_ok = true;

        materiais?.forEach((mat: any) => {
          const itemEstoque = estoque?.find(
            (e: any) =>
              e.item.toLowerCase() === mat.material_nome.toLowerCase()
          );

          if (!itemEstoque || itemEstoque.quantidade < mat.quantidade * op.quantidade) {
            materiais_ok = false;
          }
        });

        return {
          ...op,
          materiais_ok,
        };
      });

      setLista(ordensAtualizadas);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao validar produção');
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

  const stats = {
    aguardando: lista.filter((i) => i.status === 'Aguardando material').length,
    prontas: lista.filter((i) => i.status === 'Pronta para produção').length,
    producao: lista.filter((i) => i.status === 'Em produção').length,
    finalizadas: lista.filter((i) => i.status === 'Finalizada').length,
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
      {/* CARDS */}
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="erp-card p-5">
          <p className="text-xs text-slate-500">Aguardando material</p>
          <p className="text-3xl font-bold">{stats.aguardando}</p>
        </div>

        <div className="erp-card p-5">
          <p className="text-xs text-slate-500">Prontas</p>
          <p className="text-3xl font-bold">{stats.prontas}</p>
        </div>

        <div className="erp-card p-5">
          <p className="text-xs text-slate-500">Em produção</p>
          <p className="text-3xl font-bold">{stats.producao}</p>
        </div>

        <div className="erp-card p-5">
          <p className="text-xs text-slate-500">Finalizadas</p>
          <p className="text-3xl font-bold">{stats.finalizadas}</p>
        </div>
      </section>

      {/* LISTA */}
      <section className="erp-card p-5 space-y-4">
        <input
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="erp-input w-full"
        />

        <div className="grid gap-4">
          {filtered.map((op) => (
            <div key={op.id} className="p-4 border rounded-2xl space-y-3">
              <div className="flex justify-between">
                <b>{op.produto}</b>
                <span className={`px-2 py-1 rounded ${statusConfig[op.status]}`}>
                  {op.status}
                </span>
              </div>

              <div className="text-sm text-slate-500">
                Pedido: {op.pedido_numero} | Cliente: {op.cliente_nome}
              </div>

              {/* 🔥 VALIDAÇÃO VISUAL */}
              <div>
                {op.materiais_ok ? (
                  <span className="text-green-600 font-semibold">
                    ✅ Materiais OK
                  </span>
                ) : (
                  <span className="text-red-600 font-semibold">
                    🚨 Falta material
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(op, 'Em produção', 10)}
                  className="erp-button-primary text-xs"
                >
                  Iniciar
                </button>

                <button
                  onClick={() => updateStatus(op, 'Pausada')}
                  className="erp-button-secondary text-xs"
                >
                  Pausar
                </button>

                <button
                  onClick={() => updateStatus(op, 'Finalizada', 100)}
                  className="bg-green-500 text-white px-3 py-2 rounded text-xs"
                >
                  Finalizar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
