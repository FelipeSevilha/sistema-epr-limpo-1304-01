'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Factory,
  Flag,
  GripVertical,
  History,
  Layers3,
  MoveRight,
  PackageCheck,
  TimerReset,
  TrendingUp,
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
  updated_at?: string | null;
};

type HistoricoItem = {
  id: string;
  ordem_id: string;
  pedido_id?: string | null;
  pedido_numero?: string | null;
  cliente_nome?: string | null;
  produto_nome?: string | null;
  de_etapa?: string | null;
  para_etapa: string;
  prioridade?: string | null;
  movido_em?: string | null;
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

function formatarDuracaoHoras(horas: number) {
  if (!Number.isFinite(horas) || horas <= 0) return '0h';
  if (horas < 24) return `${horas.toFixed(1)}h`;
  const dias = horas / 24;
  return `${dias.toFixed(1)}d`;
}

function diffHours(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;

  const inicio = new Date(start).getTime();
  const fim = new Date(end).getTime();

  if (!Number.isFinite(inicio) || !Number.isFinite(fim) || fim < inicio) return 0;
  return (fim - inicio) / (1000 * 60 * 60);
}

export default function ProducaoPage() {
  const [ordens, setOrdens] = useState<OrdemItem[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropEtapa, setDropEtapa] = useState<string | null>(null);

  async function carregar() {
    try {
      setLoading(true);
      setError('');

      const [ordensRes, historicoRes] = await Promise.all([
        supabase.from('ordens_producao').select('*').order('created_at', { ascending: false }),
        supabase.from('historico_producao').select('*').order('movido_em', { ascending: false }),
      ]);

      if (ordensRes.error) throw ordensRes.error;
      if (historicoRes.error) throw historicoRes.error;

      setOrdens(Array.isArray(ordensRes.data) ? (ordensRes.data as OrdemItem[]) : []);
      setHistorico(Array.isArray(historicoRes.data) ? (historicoRes.data as HistoricoItem[]) : []);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao carregar produção');
    } finally {
      setLoading(false);
    }
  }

  async function registrarHistorico(ordem: OrdemItem, deEtapa: string | null, paraEtapa: string) {
    try {
      const payload = {
        ordem_id: ordem.id,
        pedido_id: ordem.pedido_id || null,
        pedido_numero: ordem.pedido_numero || null,
        cliente_nome: ordem.cliente_nome || null,
        produto_nome: getProdutoNome(ordem),
        de_etapa: deEtapa,
        para_etapa: paraEtapa,
        prioridade: getPrioridade(ordem),
        movido_em: new Date().toISOString(),
      };

      const { error } = await supabase.from('historico_producao').insert(payload);
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao registrar histórico:', err);
    }
  }

  async function mover(id: string, novaEtapa: string) {
    try {
      const ordem = ordens.find((item) => item.id === id);
      if (!ordem) return;

      const etapaAtual = ordem.etapa || 'Aguardando';
      if (etapaAtual === novaEtapa) return;

      const updates: Record<string, any> = {
        etapa: novaEtapa,
        updated_at: new Date().toISOString(),
        status: novaEtapa === 'Finalizado' ? 'Finalizado' : 'Em produção',
      };

      const { error } = await supabase
        .from('ordens_producao')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await registrarHistorico(ordem, etapaAtual, novaEtapa);

      if (ordem.pedido_id) {
        await supabase
          .from('pedidos')
          .update({
            status: novaEtapa === 'Finalizado' ? 'Pronto' : 'Em Produção',
            updated_at: new Date().toISOString(),
          })
          .eq('id', ordem.pedido_id);
      }

      await carregar();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao mover etapa');
    }
  }

  async function atualizarPrioridade(id: string, prioridade: string) {
    try {
      const ordem = ordens.find((item) => item.id === id);
      if (!ordem) return;

      const { error } = await supabase
        .from('ordens_producao')
        .update({
          prioridade,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      await registrarHistorico(ordem, ordem.etapa || 'Aguardando', ordem.etapa || 'Aguardando');
      await carregar();
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

  const historicoRecente = useMemo(() => {
    return historico.slice(0, 8);
  }, [historico]);

  const performanceEtapas = useMemo(() => {
    const porOrdem: Record<string, HistoricoItem[]> = {};

    historico.forEach((item) => {
      if (!item?.ordem_id) return;
      if (!porOrdem[item.ordem_id]) {
        porOrdem[item.ordem_id] = [];
      }
      porOrdem[item.ordem_id].push(item);
    });

    return ETAPAS.map((etapa) => {
      const itensEtapa = historico.filter((h) => h?.para_etapa === etapa);

      let somaHoras = 0;
      let totalTransicoesComTempo = 0;

      Object.values(porOrdem).forEach((items) => {
        const ordenados = [...items].sort((a, b) => {
          return new Date(a.movido_em || 0).getTime() - new Date(b.movido_em || 0).getTime();
        });

        ordenados.forEach((atual, index) => {
          if (atual.para_etapa !== etapa) return;

          const proximo = ordenados[index + 1];
          const horas = diffHours(atual.movido_em, proximo?.movido_em);

          if (horas > 0) {
            somaHoras += horas;
            totalTransicoesComTempo += 1;
          }
        });
      });

      const mediaHoras =
        totalTransicoesComTempo > 0 ? somaHoras / totalTransicoesComTempo : 0;

      return {
        etapa,
        entradas: itensEtapa.length,
        mediaHoras,
      };
    });
  }, [historico]);

  const onDragStart = (id: string) => {
    setDraggingId(id);
  };

  const onDropNaEtapa = async (etapa: string) => {
    if (!draggingId) return;
    await mover(draggingId, etapa);
    setDraggingId(null);
    setDropEtapa(null);
  };

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

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="overflow-x-auto pb-4">
          <div className="flex min-w-max gap-4">
            {ETAPAS.map((etapa) => {
              const lista = ordens.filter((o) => (o.etapa || 'Aguardando') === etapa);
              const ativaDrop = dropEtapa === etapa;

              return (
                <div
                  key={etapa}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropEtapa(etapa);
                  }}
                  onDragLeave={() => {
                    if (dropEtapa === etapa) setDropEtapa(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    await onDropNaEtapa(etapa);
                  }}
                  className={`w-[330px] shrink-0 rounded-3xl border bg-white shadow-sm transition dark:bg-slate-900 ${
                    ativaDrop
                      ? 'border-sky-400 ring-2 ring-sky-200 dark:border-sky-500 dark:ring-sky-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
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
                            draggable
                            onDragStart={() => onDragStart(ordem.id)}
                            onDragEnd={() => {
                              setDraggingId(null);
                              setDropEtapa(null);
                            }}
                            className={`cursor-grab rounded-2xl border p-4 shadow-sm transition active:cursor-grabbing ${
                              draggingId === ordem.id ? 'opacity-60' : 'opacity-100'
                            } ${
                              atrasado
                                ? 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5'
                                : 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/60'
                            }`}
                          >
                            <div className="mb-3 flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2">
                                <div className="mt-1 rounded-xl bg-slate-100 p-1.5 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                                  <GripVertical className="h-4 w-4" />
                                </div>

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
                                  {getPrazo(ordem)
                                    ? new Date(`${getPrazo(ordem)}T00:00:00`).toLocaleDateString('pt-BR')
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
                                <select
                                  value={ordem.etapa || 'Aguardando'}
                                  onChange={(e) => mover(ordem.id, e.target.value)}
                                  className="erp-input w-full"
                                >
                                  {ETAPAS.map((item) => (
                                    <option key={item}>{item}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                        Solte uma ordem aqui ou deixe esta etapa livre.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="erp-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <TimerReset className="h-5 w-5 text-sky-500" />
              <div>
                <h2 className="erp-section-title">Tempo por etapa</h2>
                <p className="erp-section-subtitle">Média com base no histórico</p>
              </div>
            </div>

            <div className="space-y-3">
              {performanceEtapas.map((item) => (
                <div
                  key={item.etapa}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.etapa}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.entradas} movimentação(ões)
                      </p>
                    </div>

                    <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                      {formatarDuracaoHoras(item.mediaHoras)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="erp-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <History className="h-5 w-5 text-violet-500" />
              <div>
                <h2 className="erp-section-title">Histórico recente</h2>
                <p className="erp-section-subtitle">Últimas movimentações</p>
              </div>
            </div>

            <div className="space-y-3">
              {historicoRecente.length > 0 ? (
                historicoRecente.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70"
                  >
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {item.produto_nome || 'Sem produto'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {item.cliente_nome || 'Sem cliente'}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                      <span>{item.de_etapa || 'Entrada'}</span>
                      <MoveRight className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold">{item.para_etapa}</span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {item.movido_em
                          ? new Date(item.movido_em).toLocaleString('pt-BR')
                          : 'Sem data'}
                      </span>

                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${prioridadeClasse(item.prioridade || 'Normal')}`}>
                        {item.prioridade || 'Normal'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  Ainda não há histórico registrado.
                </div>
              )}
            </div>
          </div>

          <div className="erp-card p-5">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <div>
                <h2 className="erp-section-title">Desempenho por setor</h2>
                <p className="erp-section-subtitle">Leitura rápida do fluxo</p>
              </div>
            </div>

            <div className="space-y-3">
              {performanceEtapas.map((item) => (
                <div
                  key={`${item.etapa}-performance`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.etapa}
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {item.entradas} passagem(ns)
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                      style={{
                        width: `${Math.min(item.entradas * 12, 100)}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Tempo médio: {formatarDuracaoHoras(item.mediaHoras)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
