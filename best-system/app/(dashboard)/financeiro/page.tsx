'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase, ContaPagar, ContaReceber, Cliente, Pedido } from '@/lib/supabase';
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
  CalendarRange,
  BadgeDollarSign,
  Users,
  ReceiptText,
} from 'lucide-react';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
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
  recorrencia_ativa: boolean;
  parcela_atual: string;
  parcela_total: string;
};

type ContaReceberForm = {
  cliente_nome: string;
  descricao: string;
  valor: string;
  vencimento: string;
  status: 'Pendente' | 'Recebido' | 'Vencido';
  recorrencia_ativa: boolean;
  parcela_atual: string;
  parcela_total: string;
};

type MetaCard = {
  id: string;
  titulo: string;
  periodo: string;
  meta: number;
  realizado: number;
  categoria: string;
  responsavel: string;
  status: 'Em andamento' | 'Concluída' | 'Planejada';
};

type FluxoRow = {
  data: string;
  dataISO: string;
  entradas: number;
  saidas: number;
  saldo: number;
};

type AgendaFinanceiraRow = {
  id: string;
  tipo: 'Pagar' | 'Receber';
  descricao: string;
  cliente?: string;
  valor: number;
  vencimento: string;
  status: string;
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

const ANOS = Array.from({ length: 60 }, (_, i) => 2026 + i);

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
  recorrencia_ativa: false,
  parcela_atual: '1',
  parcela_total: '1',
};

const initialContaReceberForm: ContaReceberForm = {
  cliente_nome: '',
  descricao: '',
  valor: '',
  vencimento: '',
  status: 'Pendente',
  recorrencia_ativa: false,
  parcela_atual: '1',
  parcela_total: '1',
};

function normalizeText(value: string) {
  return (value || '').toLowerCase().trim();
}

function formatDateOnly(value?: string | null) {
  if (!value) return '—';
  const d = new Date(`${value}`.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

function parseISODate(value: string) {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addMonths(baseDate: Date, monthsToAdd: number) {
  const d = new Date(baseDate);
  d.setMonth(d.getMonth() + monthsToAdd);
  return d;
}

function toISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function periodLabelFromMeta(periodo: string) {
  if (periodo === 'Próximos 3 meses') return 'T1';
  if (periodo === 'Próximos 6 meses') return 'T2';
  if (periodo === '1 ano') return 'T4';
  return periodo;
}

function getReceberActionLabel(status: string) {
  if (status === 'Recebido') return 'Recebido';
  if (status === 'Vencido') return 'Atrasado';
  return 'A receber';
}

function getPagarActionLabel(status: string) {
  if (status === 'Pago') return 'Pago';
  if (status === 'Vencido') return 'Atrasado';
  return 'A pagar';
}

export default function FinanceiroPage() {
  const [mainTab, setMainTab] = useState<MainTab>('visao-geral');
  const [contasTab, setContasTab] = useState<ContasTab>('pagar');
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);

  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(
    anoAtual < 2026 ? 2026 : anoAtual > 2085 ? 2085 : anoAtual
  );

  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoRow[]>([]);

  const [modalOpen, setModalOpen] = useState<ModalType>(null);
  const [saving, setSaving] = useState(false);

  const [contaPagarForm, setContaPagarForm] = useState<ContaPagarForm>(initialContaPagarForm);
  const [contaReceberForm, setContaReceberForm] = useState<ContaReceberForm>(initialContaReceberForm);
  const [clienteBusca, setClienteBusca] = useState('');

  const fetchFinanceiro = useCallback(async () => {
    const [{ data: pagar }, { data: receber }, { data: clientesData }, { data: pedidosData }] =
      await Promise.all([
        supabase.from('contas_pagar').select('*').order('vencimento'),
        supabase.from('contas_receber').select('*').order('vencimento'),
        supabase.from('clientes').select('*').order('razao_social'),
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
      ]);

    if (pagar) setContasPagar(pagar as ContaPagar[]);
    if (receber) setContasReceber(receber as ContaReceber[]);
    if (clientesData) setClientes(clientesData as Cliente[]);
    if (pedidosData) setPedidos(pedidosData as Pedido[]);

    if (pagar && receber) {
      const byDate: Record<string, { entradas: number; saidas: number }> = {};

      (receber as ContaReceber[]).forEach((c) => {
        if (!c.vencimento) return;
        if (!byDate[c.vencimento]) byDate[c.vencimento] = { entradas: 0, saidas: 0 };
        byDate[c.vencimento].entradas += Number(c.valor || 0);
      });

      (pagar as ContaPagar[]).forEach((c) => {
        if (!c.vencimento) return;
        if (!byDate[c.vencimento]) byDate[c.vencimento] = { entradas: 0, saidas: 0 };
        byDate[c.vencimento].saidas += Number(c.valor || 0);
      });

      let saldoAcum = 0;

      const fluxo = Object.entries(byDate)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, v]) => {
          saldoAcum += v.entradas - v.saidas;

          return {
            data: new Date(`${data}T00:00:00`).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
            }),
            dataISO: data,
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contas_pagar' },
        () => fetchFinanceiro()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contas_receber' },
        () => fetchFinanceiro()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => fetchFinanceiro()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFinanceiro]);

  const dadosAnuais = useMemo(() => {
    const meses: Record<number, { faturamento: number; custos: number }> = {};

    pedidos.forEach((p) => {
      if (!p.created_at) return;
      const data = new Date(p.created_at);
      if (Number.isNaN(data.getTime())) return;

      const ano = data.getFullYear();
      const mes = data.getMonth() + 1;
      if (ano !== anoSelecionado) return;

      if (!meses[mes]) {
        meses[mes] = { faturamento: 0, custos: 0 };
      }

      if (!['Cancelado'].includes(p.status || '')) {
        meses[mes].faturamento += Number(p.valor || 0);
      }
    });

    contasPagar.forEach((c) => {
      if (c.ano !== anoSelecionado) return;

      if (!meses[c.mes]) {
        meses[c.mes] = { faturamento: 0, custos: 0 };
      }

      if (c.status === 'Pago') {
        meses[c.mes].custos += Number(c.valor || 0);
      }
    });

    return MESES.map((mes, i) => {
      const m = meses[i + 1] || { faturamento: 0, custos: 0 };

      return {
        mes: mes.slice(0, 3),
        mesNum: i + 1,
        faturamento: m.faturamento,
        custos: m.custos,
        lucro: m.faturamento - m.custos,
      };
    });
  }, [pedidos, contasPagar, anoSelecionado]);

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

  const contasPagarMes = useMemo(
    () => contasPagar.filter((c) => c.mes === mesSelecionado && c.ano === anoSelecionado),
    [contasPagar, mesSelecionado, anoSelecionado]
  );

  const contasReceberMes = useMemo(
    () => contasReceber.filter((c) => c.mes === mesSelecionado && c.ano === anoSelecionado),
    [contasReceber, mesSelecionado, anoSelecionado]
  );

  const totalPagarMes = contasPagarMes.reduce((sum, c) => sum + Number(c.valor || 0), 0);
  const totalReceberMes = contasReceberMes.reduce((sum, c) => sum + Number(c.valor || 0), 0);
  const saldoProjetadoMes = totalReceberMes - totalPagarMes;

  const vencidasPagar = contasPagar.filter((c) => c.status === 'Vencido');
  const vencidasReceber = contasReceber.filter((c) => c.status === 'Vencido');

  const clientesFiltrados = useMemo(() => {
    if (!clienteBusca.trim()) return [];

    return clientes
      .filter((c) => {
        const razao = normalizeText((c as any).razao_social || '');
        const fantasia = normalizeText((c as any).nome_fantasia || '');
        const termo = normalizeText(clienteBusca);
        return razao.includes(termo) || fantasia.includes(termo);
      })
      .slice(0, 8);
  }, [clienteBusca, clientes]);

  const topClientes = useMemo(() => {
    const mapa = new Map<string, number>();

    pedidos.forEach((p) => {
      const nome = (p.cliente_nome || '').trim();
      if (!nome) return;
      if ((p.status || '') === 'Cancelado') return;
      mapa.set(nome, (mapa.get(nome) || 0) + Number(p.valor || 0));
    });

    return [...mapa.entries()]
      .map(([nome, valor]) => ({ nome, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5);
  }, [pedidos]);

  const previsao30 = useMemo(() => {
    const hoje = new Date();
    const limite = addMonths(hoje, 1).getTime();

    const entradas = contasReceber
      .filter((c) => c.status !== 'Recebido')
      .filter((c) => {
        const d = parseISODate(c.vencimento);
        return d && d.getTime() <= limite;
      })
      .reduce((sum, c) => sum + Number(c.valor || 0), 0);

    const saidas = contasPagar
      .filter((c) => c.status !== 'Pago')
      .filter((c) => {
        const d = parseISODate(c.vencimento);
        return d && d.getTime() <= limite;
      })
      .reduce((sum, c) => sum + Number(c.valor || 0), 0);

    return { entradas, saidas, saldo: entradas - saidas };
  }, [contasReceber, contasPagar]);

  const agendaFinanceira = useMemo<AgendaFinanceiraRow[]>(() => {
    const pagar: AgendaFinanceiraRow[] = contasPagar
      .filter((c) => c.ano === anoSelecionado)
      .map((c) => ({
        id: `p-${c.id}`,
        tipo: 'Pagar',
        descricao: c.descricao,
        valor: Number(c.valor || 0),
        vencimento: c.vencimento,
        status: c.status,
      }));

    const receber: AgendaFinanceiraRow[] = contasReceber
      .filter((c) => c.ano === anoSelecionado)
      .map((c) => ({
        id: `r-${c.id}`,
        tipo: 'Receber',
        descricao: c.descricao,
        cliente: c.cliente_nome,
        valor: Number(c.valor || 0),
        vencimento: c.vencimento,
        status: c.status,
      }));

    return [...pagar, ...receber]
      .sort((a, b) => String(a.vencimento).localeCompare(String(b.vencimento)))
      .slice(0, 12);
  }, [contasPagar, contasReceber, anoSelecionado]);

  const metasFinanceiras = useMemo<MetaCard[]>(() => {
    const faturamentoTotalPedidos = pedidos
      .filter((p) => (p.status || '') !== 'Cancelado')
      .reduce((sum, p) => sum + Number(p.valor || 0), 0);

    const metasBase: MetaCard[] = [
      {
        id: '1',
        titulo: 'Meta de faturamento',
        periodo: 'Próximos 3 meses',
        meta: 150000,
        realizado: 0,
        categoria: 'Financeiro',
        responsavel: 'Diretoria',
        status: 'Em andamento',
      },
      {
        id: '2',
        titulo: 'Meta comercial Felipe',
        periodo: 'Próximos 3 meses',
        meta: 90000,
        realizado: 0,
        categoria: 'Vendas',
        responsavel: 'Felipe Sevilha',
        status: 'Em andamento',
      },
      {
        id: '3',
        titulo: 'Meta comercial Wanessa',
        periodo: 'Próximos 3 meses',
        meta: 75000,
        realizado: 0,
        categoria: 'Vendas',
        responsavel: 'Wanessa Castro',
        status: 'Em andamento',
      },
      {
        id: '4',
        titulo: 'Meta anual da operação',
        periodo: '1 ano',
        meta: 650000,
        realizado: 0,
        categoria: 'Estratégico',
        responsavel: 'Gestão',
        status: 'Planejada',
      },
    ];

    return metasBase.map((meta) => {
      if (meta.categoria === 'Financeiro') {
        const realizado = faturamentoTotalPedidos;
        return {
          ...meta,
          realizado,
          status: realizado >= meta.meta ? 'Concluída' : 'Em andamento',
        };
      }

      if (meta.responsavel === 'Felipe Sevilha') {
        const realizado = faturamentoTotalPedidos * 0.55;
        return {
          ...meta,
          realizado,
          status: realizado >= meta.meta ? 'Concluída' : 'Em andamento',
        };
      }

      if (meta.responsavel === 'Wanessa Castro') {
        const realizado = faturamentoTotalPedidos * 0.45;
        return {
          ...meta,
          realizado,
          status: realizado >= meta.meta ? 'Concluída' : 'Em andamento',
        };
      }

      return meta;
    });
  }, [pedidos]);

  const metasResumo = useMemo(() => {
    return {
      total: metasFinanceiras.length,
      andamento: metasFinanceiras.filter((m) => m.status === 'Em andamento').length,
      planejadas: metasFinanceiras.filter((m) => m.status === 'Planejada').length,
      concluidas: metasFinanceiras.filter((m) => m.status === 'Concluída').length,
    };
  }, [metasFinanceiras]);

  async function atualizarStatusContaPagar(id: string, status: ContaPagar['status']) {
    try {
      await supabase
        .from('contas_pagar')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      fetchFinanceiro();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar conta a pagar.');
    }
  }

  async function atualizarStatusContaReceber(id: string, status: ContaReceber['status']) {
    try {
      await supabase
        .from('contas_receber')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      fetchFinanceiro();
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar conta a receber.');
    }
  }

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

      const parcelaAtual = Number(contaPagarForm.parcela_atual || 1);
      const parcelaTotal = Number(contaPagarForm.parcela_total || 1);

      if (parcelaAtual <= 0 || parcelaTotal <= 0 || parcelaAtual > parcelaTotal) {
        alert('Revise as parcelas. Exemplo válido: 4/12.');
        return;
      }

      setSaving(true);

      const dataBase = parseISODate(contaPagarForm.vencimento);
      if (!dataBase) {
        alert('Data de vencimento inválida.');
        return;
      }

      const inserts = [];
      const repetir =
        contaPagarForm.recorrencia_ativa && parcelaTotal > parcelaAtual
          ? parcelaTotal - parcelaAtual + 1
          : 1;

      for (let i = 0; i < repetir; i += 1) {
        const dataParcela = addMonths(dataBase, i);
        const numeroParcela = contaPagarForm.recorrencia_ativa ? parcelaAtual + i : parcelaAtual;
        const descricaoFinal = contaPagarForm.recorrencia_ativa
          ? `${contaPagarForm.descricao.trim()} ${numeroParcela}/${parcelaTotal}`
          : contaPagarForm.descricao.trim();

        inserts.push({
          descricao: descricaoFinal,
          categoria: contaPagarForm.categoria.trim(),
          valor: Number(contaPagarForm.valor),
          vencimento: toISODate(dataParcela),
          status: contaPagarForm.status,
          ano: dataParcela.getFullYear(),
          mes: dataParcela.getMonth() + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      await supabase.from('contas_pagar').insert(inserts);

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

      const parcelaAtual = Number(contaReceberForm.parcela_atual || 1);
      const parcelaTotal = Number(contaReceberForm.parcela_total || 1);

      if (parcelaAtual <= 0 || parcelaTotal <= 0 || parcelaAtual > parcelaTotal) {
        alert('Revise as parcelas. Exemplo válido: 4/12.');
        return;
      }

      setSaving(true);

      const dataBase = parseISODate(contaReceberForm.vencimento);
      if (!dataBase) {
        alert('Data de vencimento inválida.');
        return;
      }

      const inserts = [];
      const repetir =
        contaReceberForm.recorrencia_ativa && parcelaTotal > parcelaAtual
          ? parcelaTotal - parcelaAtual + 1
          : 1;

      for (let i = 0; i < repetir; i += 1) {
        const dataParcela = addMonths(dataBase, i);
        const numeroParcela = contaReceberForm.recorrencia_ativa ? parcelaAtual + i : parcelaAtual;
        const descricaoFinal = contaReceberForm.recorrencia_ativa
          ? `${contaReceberForm.descricao.trim()} ${numeroParcela}/${parcelaTotal}`
          : contaReceberForm.descricao.trim();

        inserts.push({
          cliente_nome: contaReceberForm.cliente_nome.trim(),
          descricao: descricaoFinal,
          valor: Number(contaReceberForm.valor),
          vencimento: toISODate(dataParcela),
          status: contaReceberForm.status,
          ano: dataParcela.getFullYear(),
          mes: dataParcela.getMonth() + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      await supabase.from('contas_receber').insert(inserts);

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
                  Custos pagos no mês
                </p>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-3xl font-bold text-red-500">{fmt(dadosMes?.custos ?? 0)}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Base real de contas pagas
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
                  Saldo projetado do mês
                </p>
                <Wallet className="h-4 w-4 text-violet-500" />
              </div>
              <p
                className={`text-3xl font-bold ${
                  saldoProjetadoMes >= 0 ? 'text-emerald-500' : 'text-red-500'
                }`}
              >
                {fmt(saldoProjetadoMes)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Contas a receber - contas a pagar
              </p>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
            <div className="erp-card p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="erp-section-title">Desempenho anual real</h2>
                  <p className="erp-section-subtitle">Pedidos x custos pagos por mês</p>
                </div>
                <Landmark className="h-5 w-5 text-slate-400" />
              </div>

              <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosAnuais}>
                    <defs>
                      <linearGradient id="faturamentoFillReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="lucroFillReal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-slate-200 dark:text-slate-800"
                    />
                    <XAxis dataKey="mes" stroke="currentColor" className="text-xs text-slate-400" />
                    <YAxis tickFormatter={fmtShort} stroke="currentColor" className="text-xs text-slate-400" />
                    <Tooltip formatter={(value: number) => fmt(value)} />
                    <Area
                      type="monotone"
                      dataKey="faturamento"
                      stroke="#0ea5e9"
                      fill="url(#faturamentoFillReal)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="lucro"
                      stroke="#10b981"
                      fill="url(#lucroFillReal)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-6">
              <div className="erp-card p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="erp-section-title">Resumo anual</h2>
                    <p className="erp-section-subtitle">Consolidado da operação</p>
                  </div>
                  <Target className="h-5 w-5 text-slate-400" />
                </div>

                <div className="space-y-3">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Faturamento</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      {fmt(totalFaturamento)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Custos pagos</p>
                    <p className="mt-1 text-xl font-bold text-red-500">{fmt(totalCustos)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Lucro</p>
                    <p className="mt-1 text-xl font-bold text-emerald-500">{fmt(totalLucro)}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Margem média</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      {margemMedia.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="erp-card p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="erp-section-title">Alertas financeiros</h2>
                    <p className="erp-section-subtitle">Pendências e risco de caixa</p>
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

                  <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-500/20 dark:bg-violet-500/10">
                    <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                      Previsão 30 dias: {fmt(previsao30.saldo)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr,1fr]">
            <div className="erp-card p-5">
              <div className="mb-5 flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-500" />
                <div>
                  <h2 className="erp-section-title">Top clientes por faturamento</h2>
                  <p className="erp-section-subtitle">Base real da aba Pedidos</p>
                </div>
              </div>

              <div className="space-y-3">
                {topClientes.length > 0 ? (
                  topClientes.map((cliente, index) => (
                    <div
                      key={cliente.nome}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-900"
                    >
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">#{index + 1}</p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {cliente.nome}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {fmt(cliente.valor)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    Ainda não há pedidos suficientes para ranking.
                  </div>
                )}
              </div>
            </div>

            <div className="erp-card p-5">
              <div className="mb-5 flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-violet-500" />
                <div>
                  <h2 className="erp-section-title">Agenda financeira</h2>
                  <p className="erp-section-subtitle">Próximos compromissos do ano</p>
                </div>
              </div>

              <div className="space-y-3">
                {agendaFinanceira.length > 0 ? (
                  agendaFinanceira.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-wide text-slate-400">
                          {item.tipo}
                        </p>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.cliente ? `${item.cliente} • ` : ''}
                          {item.descricao}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {formatDateOnly(item.vencimento)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {fmt(item.valor)}
                        </p>
                        <span
                          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.tipo === 'Pagar'
                              ? statusPagarConfig[item.status] || statusPagarConfig.Pendente
                              : statusReceberConfig[item.status] || statusReceberConfig.Pendente
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                    Nenhuma movimentação encontrada.
                  </div>
                )}
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
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60">
                  {(contasTab === 'pagar'
                    ? ['Descrição', 'Categoria', 'Vencimento', 'Valor', 'Status', 'Ação']
                    : ['Cliente', 'Descrição', 'Vencimento', 'Valor', 'Status', 'Ação']
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
                      <tr
                        key={conta.id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      >
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                          {conta.descricao}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                          {conta.categoria}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                          {formatDateOnly(conta.vencimento)}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">
                          {fmt(conta.valor)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              statusPagarConfig[conta.status]
                            }`}
                          >
                            {getPagarActionLabel(conta.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => atualizarStatusContaPagar(conta.id, 'Pendente')}
                              className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
                            >
                              A pagar
                            </button>
                            <button
                              type="button"
                              onClick={() => atualizarStatusContaPagar(conta.id, 'Pago')}
                              className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                            >
                              Pago
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  : contasReceberMes.map((conta) => (
                      <tr
                        key={conta.id}
                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      >
                        <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">
                          {conta.cliente_nome}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                          {conta.descricao}
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                          {formatDateOnly(conta.vencimento)}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">
                          {fmt(conta.valor)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              statusReceberConfig[conta.status]
                            }`}
                          >
                            {getReceberActionLabel(conta.status)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => atualizarStatusContaReceber(conta.id, 'Recebido')}
                              className="rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-600"
                            >
                              Recebido
                            </button>
                            <button
                              type="button"
                              onClick={() => atualizarStatusContaReceber(conta.id, 'Vencido')}
                              className="rounded-xl bg-red-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-600"
                            >
                              Atrasado
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                {((contasTab === 'pagar' && contasPagarMes.length === 0) ||
                  (contasTab === 'receber' && contasReceberMes.length === 0)) && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
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

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                  />
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
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                  />
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
        <>
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Total de metas
                </p>
                <Target className="h-4 w-4 text-sky-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{metasResumo.total}</p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Em andamento
                </p>
                <Clock3 className="h-4 w-4 text-amber-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{metasResumo.andamento}</p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Planejadas
                </p>
                <Wallet className="h-4 w-4 text-cyan-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{metasResumo.planejadas}</p>
            </div>

            <div className="erp-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Concluídas
                </p>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{metasResumo.concluidas}</p>
            </div>
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            {metasFinanceiras.map((meta) => {
              const percentual =
                meta.meta > 0 ? Math.min((meta.realizado / meta.meta) * 100, 100) : 0;

              return (
                <div key={meta.id} className="erp-card p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                        {meta.categoria} • {periodLabelFromMeta(meta.periodo)}
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {meta.titulo}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {meta.periodo}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        meta.status === 'Concluída'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : meta.status === 'Em andamento'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                          : 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300'
                      }`}
                    >
                      {meta.status}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Meta</p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {fmt(meta.meta)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Realizado</p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                        {fmt(meta.realizado)}
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

                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950">
                    {meta.categoria === 'Vendas' ? (
                      <Users className="h-4 w-4 text-sky-500" />
                    ) : (
                      <BadgeDollarSign className="h-4 w-4 text-emerald-500" />
                    )}
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Responsável: <span className="font-semibold">{meta.responsavel}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </section>
        </>
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
                    Status inicial
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

                <div className="md:col-span-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Recorrência / parcelas
                    </p>
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={contaPagarForm.recorrencia_ativa}
                        onChange={(e) =>
                          setContaPagarForm((prev) => ({
                            ...prev,
                            recorrencia_ativa: e.target.checked,
                          }))
                        }
                      />
                      Repetir automaticamente
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Parcela atual
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={contaPagarForm.parcela_atual}
                        onChange={(e) =>
                          setContaPagarForm((prev) => ({
                            ...prev,
                            parcela_atual: e.target.value,
                          }))
                        }
                        className="erp-input w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Total de parcelas
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={contaPagarForm.parcela_total}
                        onChange={(e) =>
                          setContaPagarForm((prev) => ({
                            ...prev,
                            parcela_total: e.target.value,
                          }))
                        }
                        className="erp-input w-full"
                      />
                    </div>
                  </div>
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
                        const nome =
                          ((cliente as any).razao_social || (cliente as any).nome_fantasia || 'Cliente') as string;

                        return (
                          <button
                            key={(cliente as any).id}
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
                    Status inicial
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

                <div className="md:col-span-2 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Recorrência / parcelas
                    </p>
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={contaReceberForm.recorrencia_ativa}
                        onChange={(e) =>
                          setContaReceberForm((prev) => ({
                            ...prev,
                            recorrencia_ativa: e.target.checked,
                          }))
                        }
                      />
                      Repetir automaticamente
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Parcela atual
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={contaReceberForm.parcela_atual}
                        onChange={(e) =>
                          setContaReceberForm((prev) => ({
                            ...prev,
                            parcela_atual: e.target.value,
                          }))
                        }
                        className="erp-input w-full"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Total de parcelas
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={contaReceberForm.parcela_total}
                        onChange={(e) =>
                          setContaReceberForm((prev) => ({
                            ...prev,
                            parcela_total: e.target.value,
                          }))
                        }
                        className="erp-input w-full"
                      />
                    </div>
                  </div>
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
