'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase, ContaPagar, ContaReceber } from '@/lib/supabase';
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
} from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtShort = (v: number) => {
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
  return fmt(v);
};

type MainTab = 'visao-geral' | 'contas' | 'fluxo' | 'metas';
type ContasTab = 'pagar' | 'receber';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
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

export default function FinanceiroPage() {
  const [mainTab, setMainTab] = useState<MainTab>('visao-geral');
  const [contasTab, setContasTab] = useState<ContasTab>('pagar');
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [fluxoCaixa, setFluxoCaixa] = useState<{ data: string; entradas: number; saidas: number; saldo: number }[]>([]);

  const fetchFinanceiro = useCallback(async () => {
    const [{ data: pagar }, { data: receber }] = await Promise.all([
      supabase.from('contas_pagar').select('*').order('vencimento'),
      supabase.from('contas_receber').select('*').order('vencimento'),
    ]);

    if (pagar) setContasPagar(pagar);
    if (receber) setContasReceber(receber);

    if (pagar && receber) {
      const byDate: Record<string, { entradas: number; saidas: number }> = {};

      receber.forEach((c) => {
        if (!byDate[c.vencimento]) byDate[c.vencimento] = { entradas: 0, saidas: 0 };
        byDate[c.vencimento].entradas += c.valor;
      });

      pagar.forEach((c) => {
        if (!byDate[c.vencimento]) byDate[c.vencimento] = { entradas: 0, saidas: 0 };
        byDate[c.vencimento].saidas += c.valor;
      });

      let saldoAcum = 0;

      const fluxo = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, v]) => {
          saldoAcum += v.entradas - v.saidas;

          return {
            data: new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
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
  const dadosMes = useMemo(() => dadosAnuais.find((d) => d.mesNum === mesSelecionado), [dadosAnuais, mesSelecionado]);

  const totalFaturamento = useMemo(() => dadosAnuais.reduce((s, d) => s + d.faturamento, 0), [dadosAnuais]);
  const totalCustos = useMemo(() => dadosAnuais.reduce((s, d) => s + d.custos, 0), [dadosAnuais]);
  const totalLucro = useMemo(() => dadosAnuais.reduce((s, d) => s + d.lucro, 0), [dadosAnuais]);
  const margemMedia = totalFaturamento > 0 ? (totalLucro / totalFaturamento) * 100 : 0;

  const contasPagarMes = contasPagar.filter((c) => c.mes === mesSelecionado && c.ano === anoSelecionado);
  const contasReceberMes = contasReceber.filter((c) => c.mes === mesSelecionado && c.ano === anoSelecionado);

  const totalPagarMes = contasPagarMes.reduce((sum, c) => sum + c.valor, 0);
  const totalReceberMes = contasReceberMes.reduce((sum, c) => sum + c.valor, 0);
  const saldoProjetadoMes = totalReceberMes - totalPagarMes;

  const vencidasPagar = contasPagar.filter((c) => c.status === 'Vencido');
  const vencidasReceber = contasReceber.filter((c) => c.status === 'Vencido');

  const metasBase = [
    { trimestre: 'T1', periodo: 'Jan — Mar', metaFaturamento: 180000, realizadoFaturamento: 168000, metaReducaoCustos: 5, realizadoReducaoCustos: 4.2, status: 'Encerrado' },
    { trimestre: 'T2', periodo: 'Abr — Jun', metaFaturamento: 200000, realizadoFaturamento: 207000, metaReducaoCustos: 5, realizadoReducaoCustos: 5.8, status: 'Encerrado' },
    { trimestre: 'T3', periodo: 'Jul — Set', metaFaturamento: 240000, realizadoFaturamento: 242450, metaReducaoCustos: 6, realizadoReducaoCustos: 6.1, status: 'Em andamento' },
    { trimestre: 'T4', periodo: 'Out — Dez', metaFaturamento: 280000, realizadoFaturamento: 0, metaReducaoCustos: 7, realizadoReducaoCustos: 0, status: 'Futuro' },
  ];

  const metasAno = useMemo(() => {
    const seed = (anoSelecionado - 2026) * 0.08 + 1;

    return metasBase.map((q) => ({
      ...q,
      metaFaturamento: Math.round(q.metaFaturamento * seed),
      realizadoFaturamento: q.status === 'Futuro' ? 0 : Math.round(q.realizadoFaturamento * seed),
    }));
  }, [anoSelecionado]);

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
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Faturamento do mês</p>
                <DollarSign className="h-4 w-4 text-sky-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{fmt(dadosMes?.faturamento ?? 0)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{MESES[mesSelecionado - 1]} / {anoSelecionado}</p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Custos do mês</p>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-500">{fmt(dadosMes?.custos ?? 0)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {dadosMes && dadosMes.faturamento > 0 ? `${((dadosMes.custos / dadosMes.faturamento) * 100).toFixed(1)}% da receita` : '—'}
              </p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Lucro do mês</p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-emerald-500">{fmt(dadosMes?.lucro ?? 0)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Margem: {dadosMes && dadosMes.faturamento > 0 ? `${((dadosMes.lucro / dadosMes.faturamento) * 100).toFixed(1)}%` : '—'}
              </p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Saldo projetado</p>
                <Wallet className="h-4 w-4 text-cyan-500" />
              </div>
              <p className={`text-3xl font-bold ${saldoProjetadoMes >= 0 ? 'text-cyan-600 dark:text-cyan-400' : 'text-red-500'}`}>
                {fmt(saldoProjetadoMes)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Receber menos pagar no período</p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.4fr,0.9fr]">
            <div className="erp-card p-5">
              <div className="mb-5">
                <h3 className="erp-section-title">Desempenho anual</h3>
                <p className="erp-section-subtitle">Faturamento, custos e lucro acumulados por mês</p>
              </div>

              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosAnuais}>
                    <defs>
                      <linearGradient id="fatGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={fmtShort} />
                    <Tooltip formatter={(value: number) => fmt(value)} />
                    <Area type="monotone" dataKey="faturamento" stroke="#0ea5e9" fillOpacity={1} fill="url(#fatGradient)" strokeWidth={2.5} />
                    <Area type="monotone" dataKey="lucro" stroke="#10b981" fillOpacity={0} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="erp-card p-5">
                <div className="mb-4">
                  <h3 className="erp-section-title">Resumo anual</h3>
                  <p className="erp-section-subtitle">Indicadores consolidados de {anoSelecionado}</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Faturamento total</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{fmt(totalFaturamento)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Custos totais</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{fmt(totalCustos)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Lucro total</p>
                    <p className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(totalLucro)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Margem média</p>
                    <p className="mt-1 text-xl font-bold text-sky-600 dark:text-sky-400">{margemMedia.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="erp-card p-5">
                <div className="mb-4">
                  <h3 className="erp-section-title">Alertas financeiros</h3>
                  <p className="erp-section-subtitle">Pontos que merecem atenção imediata</p>
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="mt-0.5 h-4 w-4 text-red-500" />
                      <div>
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300">{vencidasPagar.length} contas a pagar vencidas</p>
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">Regularize para evitar juros e impacto no caixa.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                    <div className="flex items-start gap-3">
                      <Clock3 className="mt-0.5 h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{vencidasReceber.length} contas a receber vencidas</p>
                        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">Acompanhe cobrança para não travar o fluxo.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-500/20 dark:bg-sky-500/10">
                    <div className="flex items-start gap-3">
                      <Landmark className="mt-0.5 h-4 w-4 text-sky-500" />
                      <div>
                        <p className="text-sm font-semibold text-sky-700 dark:text-sky-300">Saldo projetado do mês: {fmt(saldoProjetadoMes)}</p>
                        <p className="mt-1 text-xs text-sky-600 dark:text-sky-400">Visão rápida para decisões de compra e produção.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {mainTab === 'contas' && (
        <>
          <section className="flex flex-wrap gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
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
          </section>

          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <div className="erp-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">A pagar no mês</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{fmt(totalPagarMes)}</p>
            </div>
            <div className="erp-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">A receber no mês</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{fmt(totalReceberMes)}</p>
            </div>
            <div className="erp-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Vencidas a pagar</p>
              <p className="mt-2 text-2xl font-bold text-red-500">{vencidasPagar.length}</p>
            </div>
            <div className="erp-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Vencidas a receber</p>
              <p className="mt-2 text-2xl font-bold text-amber-500">{vencidasReceber.length}</p>
            </div>
          </section>

          <section className="erp-card overflow-hidden">
            <div className="border-b border-slate-200/70 px-5 py-4 dark:border-slate-800">
              <h3 className="erp-section-title">{contasTab === 'pagar' ? 'Contas a pagar' : 'Contas a receber'}</h3>
              <p className="erp-section-subtitle">
                {contasTab === 'pagar'
                  ? 'Despesas e compromissos do período'
                  : 'Receitas previstas e cobranças'}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60">
                    {(contasTab === 'pagar'
                      ? ['Descrição', 'Categoria', 'Vencimento', 'Valor', 'Status']
                      : ['Cliente', 'Descrição', 'Vencimento', 'Valor', 'Status']
                    ).map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
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

                  {((contasTab === 'pagar' && contasPagarMes.length === 0) || (contasTab === 'receber' && contasReceberMes.length === 0)) && (
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
        </>
      )}

      {mainTab === 'fluxo' && (
        <section className="grid gap-6 xl:grid-cols-[1.35fr,0.85fr]">
          <div className="erp-card p-5">
            <div className="mb-5">
              <h3 className="erp-section-title">Fluxo de caixa</h3>
              <p className="erp-section-subtitle">Entradas, saídas e saldo acumulado</p>
            </div>

            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fluxoCaixa}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                  <XAxis dataKey="data" />
                  <YAxis tickFormatter={fmtShort} />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Bar dataKey="entradas" name="Entradas" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="erp-card p-5">
            <div className="mb-5">
              <h3 className="erp-section-title">Resumo do fluxo</h3>
              <p className="erp-section-subtitle">Leitura rápida do caixa projetado</p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-xs text-slate-500 dark:text-slate-400">Entradas do mês</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{fmt(totalReceberMes)}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-xs text-slate-500 dark:text-slate-400">Saídas do mês</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{fmt(totalPagarMes)}</p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                <p className="text-xs text-slate-500 dark:text-slate-400">Saldo projetado</p>
                <p className={`mt-1 text-xl font-bold ${saldoProjetadoMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {fmt(saldoProjetadoMes)}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {mainTab === 'metas' && (
        <section className="space-y-4">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Meta anual</p>
                <Target className="h-4 w-4 text-sky-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {fmt(metasAno.reduce((sum, item) => sum + item.metaFaturamento, 0))}
              </p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Realizado</p>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {fmt(metasAno.reduce((sum, item) => sum + item.realizadoFaturamento, 0))}
              </p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Trimestres ativos</p>
                <Clock3 className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {metasAno.filter((m) => m.status === 'Em andamento').length}
              </p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Meta de redução</p>
                <TrendingDown className="h-4 w-4 text-violet-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {Math.max(...metasAno.map((m) => m.metaReducaoCustos)).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {metasAno.map((meta) => {
              const pctFaturamento =
                meta.metaFaturamento > 0
                  ? Math.min((meta.realizadoFaturamento / meta.metaFaturamento) * 100, 100)
                  : 0;

              return (
                <div key={meta.trimestre} className="erp-card p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{meta.trimestre}</p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{meta.periodo}</h3>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        meta.status === 'Encerrado'
                          ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          : meta.status === 'Em andamento'
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                      }`}
                    >
                      {meta.status}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-300">Meta de faturamento</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{fmt(meta.metaFaturamento)}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500" style={{ width: `${pctFaturamento}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Realizado: {fmt(meta.realizadoFaturamento)} • {pctFaturamento.toFixed(1)}%
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Meta de redução de custos: <span className="font-bold">{meta.metaReducaoCustos.toFixed(1)}%</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Realizado: {meta.realizadoReducaoCustos.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
