'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase, ContaPagar, ContaReceber, Cliente } from '@/lib/supabase';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Target,
  ChevronDown,
  CircleCheck as CheckCircle2,
  Clock3,
  CircleAlert as AlertCircle,
  Wallet,
  Landmark,
  Plus,
  X,
  Save,
  Search,
} from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const fmtShort = (v: number) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return fmt(v);
};

type MainTab = 'visao-geral' | 'contas' | 'fluxo' | 'metas';
type ContasTab = 'pagar' | 'receber';
type ModalType = 'pagar' | 'receber' | null;

type ContaPagarForm = {
  descricao: string;
  categoria: string;
  valor: string;
  vencimento: string;
  status: 'Pendente' | 'Pago' | 'Vencido';
};

type ContaReceberForm = {
  cliente_nome: string;
  descricao: string;
  valor: string;
  vencimento: string;
  status: 'Pendente' | 'Recebido' | 'Vencido';
};

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const ANOS = Array.from({ length: 10 }, (_, i) => 2024 + i);

const BASE_MES = [52000, 61000, 55000, 67000, 72000, 68000, 81000, 74000, 87450, 79000, 91000, 105000];

function gerarDadosAnuais(ano: number) {
  const seed = (ano - 2024) * 0.08 + 1;

  return MESES.map((mes, i) => {
    const faturamento = Math.round(BASE_MES[i] * seed);
    const custos = Math.round(faturamento * (0.56 + Math.sin(i + ano) * 0.04));
    const lucro = faturamento - custos;

    return {
      mes: mes.slice(0, 3),
      mesNum: i + 1,
      faturamento,
      custos,
      lucro,
    };
  });
}

const statusPagarConfig: Record<string, string> = {
  Pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  Pago: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  Vencido: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

const statusReceberConfig: Record<string, string> = {
  Pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  Recebido: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  Vencido: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

const initialContaPagarForm: ContaPagarForm = {
  descricao: '',
  categoria: '',
  valor: '',
  vencimento: '',
  status: 'Pendente',
};

const initialContaReceberForm: ContaReceberForm = {
  cliente_nome: '',
  descricao: '',
  valor: '',
  vencimento: '',
  status: 'Pendente',
};

export default function FinanceiroPage() {
  const [mainTab, setMainTab] = useState<MainTab>('visao-geral');
  const [contasTab, setContasTab] = useState<ContasTab>('pagar');
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fluxoCaixa, setFluxoCaixa] = useState<{ data: string; entradas: number; saidas: number; saldo: number }[]>([]);

  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [saving, setSaving] = useState(false);

  const [contaPagarForm, setContaPagarForm] = useState<ContaPagarForm>(initialContaPagarForm);
  const [contaReceberForm, setContaReceberForm] = useState<ContaReceberForm>(initialContaReceberForm);
  const [clienteBusca, setClienteBusca] = useState('');

  const fetchFinanceiro = useCallback(async () => {
    const [{ data: pagar }, { data: receber }, { data: clientesData }] = await Promise.all([
      supabase.from('contas_pagar').select('*').order('vencimento'),
      supabase.from('contas_receber').select('*').order('vencimento'),
      supabase.from('clientes').select('*').order('razao_social'),
    ]);

    if (pagar) setContasPagar(pagar as ContaPagar[]);
    if (receber) setContasReceber(receber as ContaReceber[]);
    if (clientesData) setClientes(clientesData as Cliente[]);

    if (pagar && receber) {
      const byDate: Record<string, { entradas: number; saidas: number }> = {};

      (receber as ContaReceber[]).forEach((c) => {
        if (!byDate[c.vencimento]) byDate[c.vencimento] = { entradas: 0, saidas: 0 };
        byDate[c.vencimento].entradas += c.valor;
      });

      (pagar as ContaPagar[]).forEach((c) => {
        if (!byDate[c.vencimento]) byDate[c.vencimento] = { entradas: 0, saidas: 0 };
        byDate[c.vencimento].saidas += c.valor;
      });

      let saldoAcum = 0;

      const fluxo = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, v]) => {
          saldoAcum += v.entradas - v.saidas;

          return {
            data: new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
            }),
            entradas: v.entradas,
            saidas: v.saidas,
            saldo: saldoAcum,
          };
        });

      setFluxoCaixa(fluxo);
    }
  }, []);

  useEffect(() => {
    fetchFinanceiro();

    const channel = supabase
      .channel('financeiro_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_pagar' }, () => fetchFinanceiro())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas_receber' }, () => fetchFinanceiro())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFinanceiro]);

  const dadosAnuais = useMemo(() => gerarDadosAnuais(anoSelecionado), [anoSelecionado]);
  const dadosMes = useMemo(
    () => dadosAnuais.find((d) => d.mesNum === mesSelecionado),
    [dadosAnuais, mesSelecionado]
  );

  const totalFaturamento = useMemo(
    () => dadosAnuais.reduce((s, d) => s + d.faturamento, 0),
    [dadosAnuais]
  );
  const totalCustos = useMemo(
    () => dadosAnuais.reduce((s, d) => s + d.custos, 0),
    [dadosAnuais]
  );
  const totalLucro = useMemo(
    () => dadosAnuais.reduce((s, d) => s + d.lucro, 0),
    [dadosAnuais]
  );
  const margemMedia = totalFaturamento > 0 ? (totalLucro / totalFaturamento) * 100 : 0;

  const contasPagarMes = contasPagar.filter((c) => c.mes === mesSelecionado && c.ano === anoSelecionado);
  const contasReceberMes = contasReceber.filter((c) => c.mes === mesSelecionado && c.ano === anoSelecionado);

  const totalPagarMes = contasPagarMes.reduce((sum, c) => sum + c.valor, 0);
  const totalReceberMes = contasReceberMes.reduce((sum, c) => sum + c.valor, 0);
  const saldoProjetadoMes = totalReceberMes - totalPagarMes;

  const vencidasPagar = contasPagar.filter((c) => c.status === 'Vencido');
  const vencidasReceber = contasReceber.filter((c) => c.status === 'Vencido');

  const metasBase = [
    {
      trimestre: 'T1',
      periodo: 'Jan — Mar',
      metaFaturamento: 180000,
      realizadoFaturamento: 168000,
      metaReducaoCustos: 5,
      realizadoReducaoCustos: 4.2,
      status: 'Encerrado',
    },
    {
      trimestre: 'T2',
      periodo: 'Abr — Jun',
      metaFaturamento: 200000,
      realizadoFaturamento: 207000,
      metaReducaoCustos: 5,
      realizadoReducaoCustos: 5.8,
      status: 'Encerrado',
    },
    {
      trimestre: 'T3',
      periodo: 'Jul — Set',
      metaFaturamento: 240000,
      realizadoFaturamento: 242450,
      metaReducaoCustos: 6,
      realizadoReducaoCustos: 6.1,
      status: 'Em andamento',
    },
    {
      trimestre: 'T4',
      periodo: 'Out — Dez',
      metaFaturamento: 280000,
      realizadoFaturamento: 0,
      metaReducaoCustos: 7,
      realizadoReducaoCustos: 0,
      status: 'Futuro',
    },
  ];

  const metasAno = useMemo(() => {
    const seed = (anoSelecionado - 2026) * 0.08 + 1;

    return metasBase.map((q) => ({
      ...q,
      metaFaturamento: Math.round(q.metaFaturamento * seed),
      realizadoFaturamento:
        q.status === 'Futuro' ? 0 : Math.round(q.realizadoFaturamento * seed),
    }));
  }, [anoSelecionado]);

  const clientesFiltrados = useMemo(() => {
    if (!clienteBusca.trim()) return [];
    return clientes
      .filter((c) =>
        (c.razao_social || '').toLowerCase().includes(clienteBusca.toLowerCase()) ||
        (c.nome_fantasia || '').toLowerCase().includes(clienteBusca.toLowerCase())
      )
      .slice(0, 8);
  }, [clienteBusca, clientes]);

  function openNovaDespesa() {
    setContaPagarForm({
      ...initialContaPagarForm,
      vencimento: `${anoSelecionado}-${String(mesSelecionado).padStart(2, '0')}-10`,
    });
    setModalOpen('pagar');
  }

  function openNovaEntrada() {
    setContaReceberForm({
      ...initialContaReceberForm,
      vencimento: `${anoSelecionado}-${String(mesSelecionado).padStart(2, '0')}-10`,
    });
    setClienteBusca('');
    setModalOpen('receber');
  }

  function closeModal() {
    setModalOpen(null);
    setSaving(false);
    setContaPagarForm(initialContaPagarForm);
    setContaReceberForm(initialContaReceberForm);
    setClienteBusca('');
  }

  async function salvarContaPagar() {
    try {
      if (!contaPagarForm.descricao.trim()) {
        alert('Informe a descrição da despesa.');
        return;
      }

      if (!contaPagarForm.categoria.trim()) {
        alert('Informe a categoria.');
        return;
      }

      if (!contaPagarForm.valor || Number(contaPagarForm.valor) <= 0) {
        alert('Informe um valor válido.');
        return;
      }

      if (!contaPagarForm.vencimento) {
        alert('Informe o vencimento.');
        return;
      }

      setSaving(true);

      const vencimento = contaPagarForm.vencimento;
      const data = new Date(`${vencimento}T00:00:00`);

      await supabase.from('contas_pagar').insert({
        descricao: contaPagarForm.descricao.trim(),
        categoria: contaPagarForm.categoria.trim(),
        valor: Number(contaPagarForm.valor),
        vencimento,
        status: contaPagarForm.status,
        ano: data.getFullYear(),
        mes: data.getMonth() + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      closeModal();
      fetchFinanceiro();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao salvar despesa');
    } finally {
      setSaving(false);
    }
  }

  async function salvarContaReceber() {
    try {
      if (!contaReceberForm.cliente_nome.trim()) {
        alert('Informe o cliente.');
        return;
      }

      if (!contaReceberForm.descricao.trim()) {
        alert('Informe a descrição da entrada.');
        return;
      }

      if (!contaReceberForm.valor || Number(contaReceberForm.valor) <= 0) {
        alert('Informe um valor válido.');
        return;
      }

      if (!contaReceberForm.vencimento) {
        alert('Informe o vencimento.');
        return;
      }

      setSaving(true);

      const vencimento = contaReceberForm.vencimento;
      const data = new Date(`${vencimento}T00:00:00`);

      await supabase.from('contas_receber').insert({
        cliente_nome: contaReceberForm.cliente_nome.trim(),
        descricao: contaReceberForm.descricao.trim(),
        valor: Number(contaReceberForm.valor),
        vencimento,
        status: contaReceberForm.status,
        ano: data.getFullYear(),
        mes: data.getMonth() + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      closeModal();
      fetchFinanceiro();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao salvar entrada');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
          {([
            { key: 'visao-geral', label: 'Visão geral' },
            { key: 'contas', label: 'Contas' },
            { key: 'fluxo', label: 'Fluxo de caixa' },
            { key: 'metas', label: 'Metas financeiras' },
          ] as { key: MainTab; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                mainTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openNovaDespesa}
            className="inline-flex items-center rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Despesa
          </button>

          <button
            type="button"
            onClick={openNovaEntrada}
            className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Entrada
          </button>

          <div className="relative">
            <select
              value={mesSelecionado}
              onChange={(e) => setMesSelecionado(Number(e.target.value))}
              className="erp-input w-44 appearance-none pr-10"
            >
              {MESES.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="relative">
            <select
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
              className="erp-input w-32 appearance-none pr-10"
            >
              {ANOS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </section>

      {mainTab === 'visao-geral' && (
        <>
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Faturamento do mês
                </p>
                <DollarSign className="h-4 w-4 text-sky-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {fmt(dadosMes?.faturamento ?? 0)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {MESES[mesSelecionado - 1]} / {anoSelecionado}
              </p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Custos do mês
                </p>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-500">{fmt(dadosMes?.custos ?? 0)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {dadosMes && dadosMes.faturamento > 0
                  ? `${((dadosMes.custos / dadosMes.faturamento) * 100).toFixed(1)}% da receita`
                  : '—'}
              </p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Lucro do mês
                </p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-emerald-500">{fmt(dadosMes?.lucro ?? 0)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Margem:{' '}
                {dadosMes && dadosMes.faturamento > 0
                  ? `${((dadosMes.lucro / dadosMes.faturamento) * 100).toFixed(1)}%`
                  : '—'}
              </p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Saldo projetado
                </p>
                <Wallet className="h-4 w-4 text-violet-500" />
              </div>
              <p className={`text-3xl font-bold ${saldoProjetadoMes >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {fmt(saldoProjetadoMes)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Entradas - Saídas do período
              </p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="erp-card p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="erp-section-title">Desempenho anual</h2>
                  <p className="erp-section-subtitle">Faturamento, custos e lucro por mês</p>
                </div>
                <Landmark className="h-5 w-5 text-slate-400" />
              </div>

              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosAnuais}>
                    <defs>
                      <linearGradient id="faturamentoFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="lucroFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                    <XAxis dataKey="mes" stroke="currentColor" className="text-xs text-slate-400" />
                    <YAxis tickFormatter={fmtShort} stroke="currentColor" className="text-xs text-slate-400" />
                    <Tooltip formatter={(value: number) => fmt(value)} />
                    <Area type="monotone" dataKey="faturamento" stroke="#0ea5e9" fill="url(#faturamentoFill)" strokeWidth={2} />
                    <Area type="monotone" dataKey="lucro" stroke="#10b981" fill="url(#lucroFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="erp-card p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="erp-section-title">Resumo anual</h2>
                    <p className="erp-section-subtitle">Visão consolidada</p>
                  </div>
                  <Target className="h-5 w-5 text-slate-400" />
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Faturamento</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{fmt(totalFaturamento)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Custos</p>
                    <p className="mt-1 text-xl font-bold text-red-500">{fmt(totalCustos)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Lucro</p>
                    <p className="mt-1 text-xl font-bold text-emerald-500">{fmt(totalLucro)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Margem média</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{margemMedia.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="erp-card p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="erp-section-title">Alertas financeiros</h2>
                    <p className="erp-section-subtitle">Pendências e vencimentos</p>
                  </div>
                  <AlertCircle className="h-5 w-5 text-slate-400" />
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                      Contas a pagar vencidas: {vencidasPagar.length}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                      Contas a receber vencidas: {vencidasReceber.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {mainTab === 'contas' && (
        <section className="erp-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
              {([
                { key: 'pagar', label: 'Contas a pagar' },
                { key: 'receber', label: 'Contas a receber' },
              ] as { key: ContasTab; label: string }[]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setContasTab(tab.key)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    contasTab === tab.key
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={openNovaDespesa}
                className="inline-flex items-center rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Despesa
              </button>

              <button
                type="button"
                onClick={openNovaEntrada}
                className="inline-flex items-center rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Entrada
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60">
                  {(contasTab === 'pagar'
                    ? ['Descrição', 'Categoria', 'Vencimento', 'Valor', 'Status']
                    : ['Cliente', 'Descrição', 'Vencimento', 'Valor', 'Status']
                  ).map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {contasTab === 'pagar'
                  ? contasPagarMes.map((conta) => (
                      <tr key={conta.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{conta.descricao}</td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{conta.categoria}</td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                          {new Date(conta.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{fmt(conta.valor)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusPagarConfig[conta.status]}`}>
                            {conta.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  : contasReceberMes.map((conta) => (
                      <tr key={conta.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{conta.cliente_nome}</td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{conta.descricao}</td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                          {new Date(conta.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{fmt(conta.valor)}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusReceberConfig[conta.status]}`}>
                            {conta.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                {((contasTab === 'pagar' && contasPagarMes.length === 0) ||
                  (contasTab === 'receber' && contasReceberMes.length === 0)) && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                      Nenhum lançamento encontrado para o período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {mainTab === 'fluxo' && (
        <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <div className="erp-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="erp-section-title">Fluxo de caixa</h2>
                <p className="erp-section-subtitle">Entradas, saídas e saldo acumulado</p>
              </div>
              <Wallet className="h-5 w-5 text-slate-400" />
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fluxoCaixa}>
                  <defs>
                    <linearGradient id="saldoFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="data" stroke="currentColor" className="text-xs text-slate-400" />
                  <YAxis tickFormatter={fmtShort} stroke="currentColor" className="text-xs text-slate-400" />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Area type="monotone" dataKey="saldo" stroke="#8b5cf6" fill="url(#saldoFill)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="erp-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="erp-section-title">Comparativo</h2>
                <p className="erp-section-subtitle">Entradas vs saídas</p>
              </div>
              <Landmark className="h-5 w-5 text-slate-400" />
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fluxoCaixa}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                  <XAxis dataKey="data" stroke="currentColor" className="text-xs text-slate-400" />
                  <YAxis tickFormatter={fmtShort} stroke="currentColor" className="text-xs text-slate-400" />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Bar dataKey="entradas" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="saidas" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {mainTab === 'metas' && (
        <section className="grid gap-4 xl:grid-cols-2">
          {metasAno.map((meta) => {
            const percentual = meta.metaFaturamento > 0
              ? Math.min((meta.realizadoFaturamento / meta.metaFaturamento) * 100, 100)
              : 0;

            return (
              <div key={meta.trimestre} className="erp-card p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                      {meta.trimestre}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {meta.periodo}
                    </h3>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      meta.status === 'Encerrado'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                        : meta.status === 'Em andamento'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {meta.status}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Meta faturamento</p>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {fmt(meta.metaFaturamento)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Realizado</p>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {fmt(meta.realizadoFaturamento)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Progresso</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {percentual.toFixed(1)}%
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500"
                      style={{ width: `${percentual}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Redução meta</p>
                    </div>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {meta.metaReducaoCustos.toFixed(1)}%
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-amber-500" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Redução atual</p>
                    </div>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {meta.realizadoReducaoCustos.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Financeiro
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {modalOpen === 'pagar' ? 'Nova Despesa' : 'Nova Entrada'}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-red-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {modalOpen === 'pagar' ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Descrição
                  </label>
                  <input
                    value={contaPagarForm.descricao}
                    onChange={(e) =>
                      setContaPagarForm((prev) => ({ ...prev, descricao: e.target.value }))
                    }
                    placeholder="Ex: Aluguel, Energia, Fornecedor..."
                    className="erp-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Categoria
                  </label>
                  <input
                    value={contaPagarForm.categoria}
                    onChange={(e) =>
                      setContaPagarForm((prev) => ({ ...prev, categoria: e.target.value }))
                    }
                    placeholder="Ex: Fixo, Insumo, Operacional..."
                    className="erp-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Valor
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={contaPagarForm.valor}
                    onChange={(e) =>
                      setContaPagarForm((prev) => ({ ...prev, valor: e.target.value }))
                    }
                    className="erp-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Vencimento
                  </label>
                  <input
                    type="date"
                    value={contaPagarForm.vencimento}
                    onChange={(e) =>
                      setContaPagarForm((prev) => ({ ...prev, vencimento: e.target.value }))
                    }
                    className="erp-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Status
                  </label>
                  <select
                    value={contaPagarForm.status}
                    onChange={(e) =>
                      setContaPagarForm((prev) => ({
                        ...prev,
                        status: e.target.value as ContaPagarForm['status'],
                      }))
                    }
                    className="erp-input w-full"
                  >
                    <option>Pendente</option>
                    <option>Pago</option>
                    <option>Vencido</option>
                  </select>
                </div>

                <div className="md:col-span-2 mt-2 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="erp-button-secondary">
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={salvarContaPagar}
                    disabled={saving}
                    className={`erp-button-primary ${saving ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Despesa'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Cliente
                  </label>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={clienteBusca || contaReceberForm.cliente_nome}
                      onChange={(e) => {
                        setClienteBusca(e.target.value);
                        setContaReceberForm((prev) => ({
                          ...prev,
                          cliente_nome: e.target.value,
                        }));
                      }}
                      placeholder="Digite o nome do cliente..."
                      className="erp-input w-full pl-10"
                    />
                  </div>

                  {clienteBusca.trim() && clientesFiltrados.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      {clientesFiltrados.map((cliente) => {
                        const nome = cliente.razao_social || cliente.nome_fantasia || 'Cliente';
                        return (
                          <button
                            key={cliente.id}
                            type="button"
                            onClick={() => {
                              setContaReceberForm((prev) => ({
                                ...prev,
                                cliente_nome: nome,
                              }));
                              setClienteBusca(nome);
                            }}
                            className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 last:border-b-0"
                          >
                            {nome}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Descrição
                  </label>
                  <input
                    value={contaReceberForm.descricao}
                    onChange={(e) =>
                      setContaReceberForm((prev) => ({ ...prev, descricao: e.target.value }))
                    }
                    placeholder="Ex: Sinal do pedido, parcela, recebimento..."
                    className="erp-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Valor
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={contaReceberForm.valor}
                    onChange={(e) =>
                      setContaReceberForm((prev) => ({ ...prev, valor: e.target.value }))
                    }
                    className="erp-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Vencimento
                  </label>
                  <input
                    type="date"
                    value={contaReceberForm.vencimento}
                    onChange={(e) =>
                      setContaReceberForm((prev) => ({ ...prev, vencimento: e.target.value }))
                    }
                    className="erp-input w-full"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                    Status
                  </label>
                  <select
                    value={contaReceberForm.status}
                    onChange={(e) =>
                      setContaReceberForm((prev) => ({
                        ...prev,
                        status: e.target.value as ContaReceberForm['status'],
                      }))
                    }
                    className="erp-input w-full"
                  >
                    <option>Pendente</option>
                    <option>Recebido</option>
                    <option>Vencido</option>
                  </select>
                </div>

                <div className="md:col-span-2 mt-2 flex justify-end gap-3">
                  <button type="button" onClick={closeModal} className="erp-button-secondary">
                    Cancelar
                  </button>

                  <button
                    type="button"
                    onClick={salvarContaReceber}
                    disabled={saving}
                    className={`erp-button-primary ${saving ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Entrada'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
