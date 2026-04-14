'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Funnel,
  BadgeDollarSign,
  TrendingUp,
  Phone,
  MessageCircle,
  CalendarClock,
  Plus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Orcamento = {
  id: string;
  numero?: string | null;
  cliente_nome?: string | null;
  cliente_id?: string | null;
  valor_total?: number | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Pedido = {
  id: string;
  numero?: string | null;
  cliente_nome?: string | null;
  valor?: number | null;
  status?: string | null;
  created_at?: string | null;
};

type LeadStatus = 'Novo' | 'Contato' | 'Proposta' | 'Negociação' | 'Fechado';

type Lead = {
  id: string;
  cliente: string;
  origem: string;
  responsavel: string;
  status: LeadStatus;
  valorPotencial: number;
  ultimoContato: string;
  observacoes: string;
};

const leadsBase: Lead[] = [
  {
    id: 'lead-1',
    cliente: 'Construtora Horizonte',
    origem: 'WhatsApp',
    responsavel: 'Felipe Sevilha',
    status: 'Negociação',
    valorPotencial: 12800,
    ultimoContato: '2026-04-13',
    observacoes: 'Cliente interessado em materiais promocionais e cadernos.',
  },
  {
    id: 'lead-2',
    cliente: 'Escola Futuro Brilhante',
    origem: 'Instagram',
    responsavel: 'Wanessa Castro',
    status: 'Proposta',
    valorPotencial: 7600,
    ultimoContato: '2026-04-12',
    observacoes: 'Aguardando aprovação do orçamento anual.',
  },
  {
    id: 'lead-3',
    cliente: 'Auto Peças JR',
    origem: 'Indicação',
    responsavel: 'Felipe Sevilha',
    status: 'Contato',
    valorPotencial: 3200,
    ultimoContato: '2026-04-10',
    observacoes: 'Primeiro contato feito, cliente quer banners e adesivos.',
  },
  {
    id: 'lead-4',
    cliente: 'Loja Bella Casa',
    origem: 'Google',
    responsavel: 'Wanessa Castro',
    status: 'Novo',
    valorPotencial: 2100,
    ultimoContato: '2026-04-14',
    observacoes: 'Entrou hoje pedindo orçamento rápido.',
  },
  {
    id: 'lead-5',
    cliente: 'Mercado Central',
    origem: 'Carteira',
    responsavel: 'Felipe Sevilha',
    status: 'Fechado',
    valorPotencial: 9800,
    ultimoContato: '2026-04-09',
    observacoes: 'Cliente convertido em pedido.',
  },
];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);

function getLeadColor(status: LeadStatus) {
  switch (status) {
    case 'Novo':
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    case 'Contato':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300';
    case 'Proposta':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
    case 'Negociação':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300';
    case 'Fechado':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

function toLeadStatus(status?: string | null): LeadStatus {
  const value = (status || '').toLowerCase();

  if (value.includes('convert')) return 'Fechado';
  if (value.includes('aprov')) return 'Fechado';
  if (value.includes('recus')) return 'Contato';
  if (value.includes('negoc')) return 'Negociação';
  if (value.includes('propost')) return 'Proposta';
  return 'Proposta';
}

function safeDate(value?: string | null) {
  if (!value) return '2026-04-14';
  const base = value.slice(0, 10);
  return base || '2026-04-14';
}

export default function CRMPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtro, setFiltro] = useState<'Todos' | LeadStatus>('Todos');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError('');

        const [orcRes, pedRes] = await Promise.all([
          supabase.from('orcamentos').select('*').order('created_at', { ascending: false }),
          supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
        ]);

        if (orcRes.error) throw orcRes.error;
        if (pedRes.error) throw pedRes.error;

        setOrcamentos((orcRes.data as Orcamento[]) || []);
        setPedidos((pedRes.data as Pedido[]) || []);
      } catch (err: any) {
        console.error('Erro ao carregar CRM:', err);
        setError(err?.message || 'Erro ao carregar CRM');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const leads = useMemo(() => {
    const map = new Map<string, Lead>();

    leadsBase.forEach((lead) => {
      map.set(lead.cliente.toLowerCase(), lead);
    });

    orcamentos.forEach((orc) => {
      const cliente = (orc.cliente_nome || 'Cliente sem nome').trim();
      const key = cliente.toLowerCase();

      if (!map.has(key)) {
        map.set(key, {
          id: `orc-${orc.id}`,
          cliente,
          origem: 'Orçamento',
          responsavel: 'Equipe comercial',
          status: toLeadStatus(orc.status),
          valorPotencial: Number(orc.valor_total || 0),
          ultimoContato: safeDate(orc.created_at),
          observacoes: `Lead gerado a partir do orçamento ${orc.numero || 'sem número'}.`,
        });
      }
    });

    pedidos.forEach((pedido) => {
      const cliente = (pedido.cliente_nome || '').trim();
      if (!cliente) return;

      const key = cliente.toLowerCase();
      const existente = map.get(key);

      if (!existente) {
        map.set(key, {
          id: `ped-${pedido.id}`,
          cliente,
          origem: 'Pedido direto',
          responsavel: 'Equipe comercial',
          status: 'Fechado',
          valorPotencial: Number(pedido.valor || 0),
          ultimoContato: safeDate(pedido.created_at),
          observacoes: `Cliente já convertido em pedido ${pedido.numero || 'sem número'}.`,
        });
        return;
      }

      if ((pedido.status || '').toLowerCase() !== 'cancelado') {
        map.set(key, {
          ...existente,
          status: 'Fechado',
          valorPotencial: Math.max(Number(existente.valorPotencial || 0), Number(pedido.valor || 0)),
          ultimoContato: safeDate(pedido.created_at),
          observacoes:
            existente.observacoes ||
            `Cliente já convertido em pedido ${pedido.numero || 'sem número'}.`,
        });
      }
    });

    return Array.from(map.values());
  }, [orcamentos, pedidos]);

  const filtrados = useMemo(() => {
    return leads.filter((lead) => {
      const matchSearch =
        lead.cliente.toLowerCase().includes(search.toLowerCase()) ||
        lead.origem.toLowerCase().includes(search.toLowerCase()) ||
        lead.responsavel.toLowerCase().includes(search.toLowerCase());

      const matchFiltro = filtro === 'Todos' || lead.status === filtro;
      return matchSearch && matchFiltro;
    });
  }, [leads, search, filtro]);

  const resumo = useMemo(() => {
    const totalLeads = leads.length;
    const funilAberto = leads.filter((l) => l.status !== 'Fechado').length;
    const valorPipeline = leads
      .filter((l) => l.status !== 'Fechado')
      .reduce((sum, l) => sum + Number(l.valorPotencial || 0), 0);
    const fechados = leads.filter((l) => l.status === 'Fechado').length;

    return {
      totalLeads,
      funilAberto,
      valorPipeline,
      fechados,
    };
  }, [leads]);

  const vendedorRanking = useMemo(() => {
    const map = new Map<string, { nome: string; leads: number; valor: number }>();

    leads.forEach((lead) => {
      const atual = map.get(lead.responsavel) || {
        nome: lead.responsavel,
        leads: 0,
        valor: 0,
      };

      atual.leads += 1;
      atual.valor += Number(lead.valorPotencial || 0);

      map.set(lead.responsavel, atual);
    });

    return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
  }, [leads]);

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
              Leads
            </p>
            <Users className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.totalLeads}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Funil aberto
            </p>
            <Funnel className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.funilAberto}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Pipeline
            </p>
            <BadgeDollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(resumo.valorPipeline)}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Fechados
            </p>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.fechados}</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
        <div className="erp-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar lead, origem ou responsável..."
                  className="erp-input w-80 pl-10"
                />
              </div>

              {(['Todos', 'Novo', 'Contato', 'Proposta', 'Negociação', 'Fechado'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFiltro(status)}
                  className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                    filtro === status
                      ? 'bg-sky-500 text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500/30 dark:hover:text-sky-400'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <button
              className="erp-button-primary"
              onClick={() =>
                alert('Na próxima etapa eu adiciono cadastro manual de lead e automações comerciais.')
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Lead
            </button>
          </div>

          <div className="grid gap-4 p-5">
            {filtrados.length > 0 ? (
              filtrados.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {lead.cliente}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Origem: {lead.origem}
                      </p>
                    </div>

                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getLeadColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Responsável</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{lead.responsavel}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Valor potencial</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{fmt(lead.valorPotencial)}</p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Último contato</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {new Date(`${lead.ultimoContato}T00:00:00`).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                    <p className="text-sm text-slate-700 dark:text-slate-200">{lead.observacoes}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="erp-button-secondary px-3 py-2 text-xs">
                      <Phone className="mr-1.5 h-4 w-4" />
                      Ligar
                    </button>

                    <button className="erp-button-secondary px-3 py-2 text-xs">
                      <MessageCircle className="mr-1.5 h-4 w-4" />
                      WhatsApp
                    </button>

                    <button className="erp-button-secondary px-3 py-2 text-xs">
                      <CalendarClock className="mr-1.5 h-4 w-4" />
                      Follow-up
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Nenhum lead encontrado.
              </div>
            )}
          </div>
        </div>

        <div className="erp-card p-5">
          <h2 className="erp-section-title">Ranking comercial</h2>
          <p className="erp-section-subtitle">Valor potencial por responsável</p>

          <div className="mt-5 space-y-3">
            {vendedorRanking.length > 0 ? (
              vendedorRanking.map((item, index) => (
                <div
                  key={`${item.nome}-${index}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.nome}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.leads} lead(s)
                      </p>
                    </div>

                    <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {fmt(item.valor)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Sem dados comerciais no momento.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
