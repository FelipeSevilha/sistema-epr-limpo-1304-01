'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Clock3,
  Factory,
  Flag,
  Layers3,
  PackageCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type OrdemItem = {
  id: string;
  pedido_id?: string | null;
  pedido_numero?: string | null;
  cliente_nome?: string | null;
  produto_nome?: string | null;
  produto?: string | null;
  quantidade?: number | null;
  etapa?: string | null;
  status?: string | null;
  prioridade?: string | null;
  prazo?: string | null;
  created_at?: string | null;
};

const ETAPAS = [
  'Aguardando',
  'Pré-impressão',
  'Impressão',
  'Acabamento',
  'Finalizado',
];

const PRIORIDADES = ['Baixa', 'Normal', 'Alta', 'Urgente'];

function getProdutoNome(ordem: OrdemItem) {
  return ordem.produto_nome || ordem.produto || 'Sem produto';
}

function getPrioridade(ordem: OrdemItem) {
  return ordem.prioridade || 'Normal';
}

function getPrazo(ordem: OrdemItem) {
  return ordem.prazo || null;
}

function isAtrasado(ordem: OrdemItem) {
  if (!ordem.prazo) return false;
  if ((ordem.etapa || '') === 'Finalizado') return false;

  const hoje = new Date();
  const prazo = new Date(`${ordem.prazo}T23:59:59`);
  return prazo < hoje;
}

function prioridadeClasse(prioridade: string) {
  switch (prioridade) {
    case 'Urgente':
      return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300';
    case 'Alta':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
    case 'Baixa':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    default:
      return 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300';
  }
}

function etapaHeaderClasse(etapa: string) {
  switch (etapa) {
    case 'Aguardando':
      return 'border-slate-200 dark:border-slate-800';
    case 'Pré-impressão':
      return 'border-sky-200 dark:border-sky-500/20';
    case 'Impressão':
      return 'border-violet-200 dark:border-violet-500/20';
    case 'Acabamento':
      return 'border-amber-200 dark:border-amber-500/20';
    case 'Finalizado':
      return 'border-emerald-200 dark:border-emerald-500/20';
    default:
      return 'border-slate-200 dark:border-slate-800';
  }
}

export default function ProducaoPage() {
  const [ordens, setOrdens] = useState<OrdemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function carregar() {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase
        .from('ordens_producao')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrdens((data as OrdemItem[]) || []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao carregar produção');
    } finally {
      setLoading(false);
    }
  }

  async function mover(id: string, novaEtapa: string) {
    try {
      const updates: Record<string, any> = {
        etapa: novaEtapa,
      };

      if (novaEtapa === 'Finalizado') {
        updates.status = 'Finalizado';
      } else {
        updates.status = 'Em produção';
      }

      const { error } = await supabase
        .from('ordens_producao')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      carregar();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao mover etapa');
    }
  }

  async function atualizarPrioridade(id: string, prioridade: string) {
    try {
      const { error } = await supabase
        .from('ordens_producao')
        .update({ prioridade })
        .eq('id', id);

      if (error) throw error;

      carregar();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao atualizar prioridade');
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const resumo = useMemo(() => {
    const total = ordens.length;
    const atrasadas = ordens.filter((o) => isAtrasado(o)).length;
    const urgentes = ordens.filter((o) => getPrioridade(o) === 'Urgente').length;
    const finalizadas = ordens.filter((o) => (o.etapa || '') === 'Finalizado').length;

    const gargalo = ETAPAS
      .map((etapa) => ({
        etapa,
        total: ordens.filter((o) => (o.etapa || 'Aguardando') === etapa).length,
      }))
      .sort((a, b) => b.total - a.total)[0];

    return {
      total,
      atrasadas,
      urgentes,
      finalizadas,
      gargalo: gargalo?.etapa || '—',
      gargaloTotal: gargalo?.total || 0,
    };
  }, [ordens]);

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
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ordens
            </p>
            <Layers3 className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.total}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Atrasadas
            </p>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.atrasadas}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Urgentes
            </p>
            <Flag className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.urgentes}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Finalizadas
            </p>
            <PackageCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.finalizadas}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Gargalo
            </p>
            <Factory className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-base font-bold text-slate-900 dark:text-white">{resumo.gargalo}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {resumo.gargaloTotal} ordem(ns)
          </p>
        </div>
      </section>

      <section className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-4">
          {ETAPAS.map((etapa) => {
            const lista = ordens.filter((o) => (o.etapa || 'Aguardando') === etapa);

            return (
              <div
                key={etapa}
                className="w-[320px] shrink-0 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className={`border-b px-4 py-4 ${etapaHeaderClasse(etapa)}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {etapa}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {lista.length} ordem(ns)
                      </p>
                    </div>

                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {lista.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 p-4">
                  {lista.length > 0 ? (
                    lista.map((ordem) => {
                      const prioridade = getPrioridade(ordem);
                      const atrasado = isAtrasado(ordem);

                      return (
                        <div
                          key={ordem.id}
                          className={`rounded-2xl border p-4 shadow-sm transition ${
                            atrasado
                              ? 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5'
                              : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/60'
                          }`}
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                {ordem.pedido_numero || 'Sem pedido'}
                              </p>
                              <h3 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                                {getProdutoNome(ordem)}
                              </h3>
                              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {ordem.cliente_nome || 'Sem cliente'}
                              </p>
                            </div>

                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${prioridadeClasse(prioridade)}`}>
                              {prioridade}
                            </span>
                          </div>

                          <div className="grid gap-3">
                            <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Quantidade
                              </p>
                              <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                                {Number(ordem.quantidade || 0).toLocaleString('pt-BR')}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                              <div className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-sky-500" />
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Prazo
                                </p>
                              </div>
                              <p className={`mt-1 font-semibold ${atrasado ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                                {ordem.prazo
                                  ? new Date(`${ordem.prazo}T00:00:00`).toLocaleDateString('pt-BR')
                                  : 'Não informado'}
                              </p>
                            </div>

                            {atrasado && (
                              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                                <div className="flex items-center gap-2">
                                  <Clock3 className="h-4 w-4 text-red-500" />
                                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                    Ordem atrasada
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-4 space-y-3">
                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                Prioridade
                              </label>
                              <select
                                value={prioridade}
                                onChange={(e) => atualizarPrioridade(ordem.id, e.target.value)}
                                className="erp-input w-full"
                              >
                                {PRIORIDADES.map((item) => (
                                  <option key={item}>{item}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                Mover etapa
                              </label>
                              <div className="flex items-center gap-2">
                                <select
                                  value={ordem.etapa || 'Aguardando'}
                                  onChange={(e) => mover(ordem.id, e.target.value)}
                                  className="erp-input w-full"
                                >
                                  {ETAPAS.map((item) => (
                                    <option key={item}>{item}</option>
                                  ))}
                                </select>

                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                  <ChevronRight className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      Sem ordens nesta etapa.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
