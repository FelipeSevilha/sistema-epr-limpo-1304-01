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
  Workflow,
  X,
  Save,
  TrendingUp,
  CircleDollarSign,
  Printer,
  Scissors,
  Package,
  Cog,
  Target,
  BadgeDollarSign,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type PedidoRow = {
  id: string;
  numero?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  orcamento_id?: string | null;
  orcamento_numero?: string | null;
  produto?: string | null;
  quantidade?: number | null;
  valor?: number | null;
  status?: string | null;
  prazo?: string | null;
  observacoes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type OrdemProducaoRow = {
  id: string;
  pedido_id?: string | null;
  pedido_numero?: string | null;
  produto?: string | null;
  quantidade?: number | null;
  custo_previsto?: number | null;
  prioridade?: string | null;
  etapa?: string | null;
  prazo?: string | null;
};

type FichaTecnicaItem = {
  id: string;
  produto_nome: string;
  material_nome: string;
  quantidade: number;
  unidade: string;
};

type EstoqueItem = {
  id: string;
  item: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  estoque_minimo: number;
  fornecedor: string;
  valor_unitario: number;
};

type CostBreakdown = {
  material: number;
  impressao: number;
  acabamento: number;
  operacional: number;
  total: number;
};

type PedidoFormData = {
  cliente_nome: string;
  produto: string;
  quantidade: string;
  valor: string;
  prazo: string;
  observacoes: string;
  status: string;
};

const statusStyles: Record<string, string> = {
  Aguardando: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  'Em Andamento': 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  'Em Produção': 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  'Em Acabamento': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300',
  Pronto: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  Entregue: 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-300',
  Cancelado: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Atrasado: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

const initialForm: PedidoFormData = {
  cliente_nome: '',
  produto: '',
  quantidade: '',
  valor: '',
  prazo: '',
  observacoes: '',
  status: 'Aguardando',
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);

function getStatus(pedido: PedidoRow) {
  if (!pedido.prazo) return pedido.status || 'Aguardando';

  const status = pedido.status || 'Aguardando';
  if (status === 'Entregue' || status === 'Cancelado') return status;

  const prazo = new Date(`${pedido.prazo}T23:59:59`);
  if (prazo < new Date()) return 'Atrasado';

  return status;
}

function nextPedidoNumero(pedidos: PedidoRow[]) {
  const numeros = pedidos
    .map((p) => Number(String(p.numero || '').replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n) && n > 0);

  const max = numeros.length ? Math.max(...numeros) : 1042;
  return `P-${String(max + 1).padStart(4, '0')}`;
}

function normalizeText(value: string) {
  return (value || '').toLowerCase().trim();
}

function inferGroup(materialName: string, categoria: string) {
  const text = `${materialName} ${categoria}`.toLowerCase();

  if (
    text.includes('impress') ||
    text.includes('pb') ||
    text.includes('p&b') ||
    text.includes('colorid') ||
    text.includes('cmyk') ||
    text.includes('toner')
  ) {
    return 'impressao';
  }

  if (
    text.includes('wire') ||
    text.includes('bopp') ||
    text.includes('lamina') ||
    text.includes('laminação') ||
    text.includes('laminacao') ||
    text.includes('verniz') ||
    text.includes('faca') ||
    text.includes('corte') ||
    text.includes('vinco') ||
    text.includes('dobr') ||
    text.includes('espiral') ||
    text.includes('acabamento')
  ) {
    return 'acabamento';
  }

  return 'material';
}

function calculateOperationalCost(
  quantidade: number,
  material: number,
  impressao: number,
  acabamento: number
) {
  const baseMovimentacao = quantidade * 0.12;
  const baseSetup = 18;
  const percentual = (material + impressao + acabamento) * 0.08;
  return Number((baseMovimentacao + baseSetup + percentual).toFixed(2));
}

function buildCostBreakdown(
  produtoNome: string,
  quantidadeProducao: number,
  ficha: FichaTecnicaItem[],
  estoque: EstoqueItem[]
): CostBreakdown {
  const materiais = ficha.filter((f) => normalizeText(f.produto_nome) === normalizeText(produtoNome));

  let material = 0;
  let impressao = 0;
  let acabamento = 0;

  for (const item of materiais) {
    const itemEstoque = estoque.find(
      (e) => normalizeText(e.item) === normalizeText(item.material_nome)
    );

    if (!itemEstoque) continue;

    const consumoTotal = Number(item.quantidade || 0) * Number(quantidadeProducao || 0);
    const custoItem = consumoTotal * Number(itemEstoque.valor_unitario || 0);
    const group = inferGroup(item.material_nome, itemEstoque.categoria || '');

    if (group === 'impressao') {
      impressao += custoItem;
    } else if (group === 'acabamento') {
      acabamento += custoItem;
    } else {
      material += custoItem;
    }
  }

  const operacional = calculateOperationalCost(
    quantidadeProducao,
    material,
    impressao,
    acabamento
  );

  const total = material + impressao + acabamento + operacional;

  return {
    material: Number(material.toFixed(2)),
    impressao: Number(impressao.toFixed(2)),
    acabamento: Number(acabamento.toFixed(2)),
    operacional: Number(operacional.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}

function calculateSuggestedPrice(custo: number, margemAlvo: number) {
  if (custo <= 0) return 0;
  const divisor = 1 - margemAlvo / 100;
  if (divisor <= 0) return custo;
  return Number((custo / divisor).toFixed(2));
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [ordens, setOrdens] = useState<OrdemProducaoRow[]>([]);
  const [ficha, setFicha] = useState<FichaTecnicaItem[]>([]);
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<PedidoRow | null>(null);
  const [error, setError] = useState('');
  const [gerandoOpId, setGerandoOpId] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingPedido, setEditingPedido] = useState<PedidoRow | null>(null);
  const [form, setForm] = useState<PedidoFormData>(initialForm);
  const [margemAlvo, setMargemAlvo] = useState(30);

  async function fetchPedidos() {
    try {
      setLoading(true);
      setError('');

      const [pedidosRes, ordensRes, fichaRes, estoqueRes] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }),
        supabase.from('ordens_producao').select('*').order('created_at', { ascending: false }),
        supabase.from('ficha_tecnica').select('*'),
        supabase.from('estoque').select('*'),
      ]);

      if (pedidosRes.error) throw pedidosRes.error;
      if (ordensRes.error) throw ordensRes.error;
      if (fichaRes.error) throw fichaRes.error;
      if (estoqueRes.error) throw estoqueRes.error;

      setPedidos((pedidosRes.data as PedidoRow[]) || []);
      setOrdens((ordensRes.data as OrdemProducaoRow[]) || []);
      setFicha((fichaRes.data as FichaTecnicaItem[]) || []);
      setEstoque((estoqueRes.data as EstoqueItem[]) || []);
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

  const ordensMap = useMemo(() => {
    const map = new Map<string, OrdemProducaoRow>();
    ordens.forEach((op) => {
      if (op.pedido_id) {
        map.set(op.pedido_id, op);
      }
    });
    return map;
  }, [ordens]);

  const breakdownMap = useMemo(() => {
    const map = new Map<string, CostBreakdown>();

    ordens.forEach((ordem) => {
      if (!ordem.pedido_id) return;

      const breakdown = buildCostBreakdown(
        ordem.produto || '',
        Number(ordem.quantidade || 0),
        ficha,
        estoque
      );

      map.set(ordem.pedido_id, breakdown);
    });

    return map;
  }, [ordens, ficha, estoque]);

  const pedidosComOp = useMemo(() => {
    return new Set(ordens.map((op) => op.pedido_id).filter(Boolean));
  }, [ordens]);

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

  const previewBreakdown = useMemo(() => {
    if (!form.produto.trim() || !form.quantidade || Number(form.quantidade) <= 0) {
      return null;
    }

    return buildCostBreakdown(
      form.produto,
      Number(form.quantidade),
      ficha,
      estoque
    );
  }, [form.produto, form.quantidade, ficha, estoque]);

  const precoSugeridoPreview = useMemo(() => {
    if (!previewBreakdown) return 0;
    return calculateSuggestedPrice(Number(previewBreakdown.total || 0), margemAlvo);
  }, [previewBreakdown, margemAlvo]);

  const margemPreview = useMemo(() => {
    const valor = Number(form.valor || 0);
    const custo = Number(previewBreakdown?.total || 0);
    if (valor <= 0) return 0;
    return Number((((valor - custo) / valor) * 100).toFixed(2));
  }, [form.valor, previewBreakdown]);

  function openNewForm() {
    setEditingPedido(null);
    setForm(initialForm);
    setFormOpen(true);
  }

  function openEditForm(pedido: PedidoRow) {
    setEditingPedido(pedido);
    setForm({
      cliente_nome: pedido.cliente_nome || '',
      produto: pedido.produto || '',
      quantidade: String(pedido.quantidade ?? ''),
      valor: String(pedido.valor ?? ''),
      prazo: pedido.prazo || '',
      observacoes: pedido.observacoes || '',
      status: pedido.status || 'Aguardando',
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingPedido(null);
    setForm(initialForm);
  }

  function updateForm<K extends keyof PedidoFormData>(field: K, value: PedidoFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSavePedido() {
    try {
      if (!form.cliente_nome.trim()) {
        alert('Informe o cliente.');
        return;
      }

      if (!form.produto.trim()) {
        alert('Informe o produto.');
        return;
      }

      if (!form.quantidade || Number(form.quantidade) <= 0) {
        alert('Informe uma quantidade válida.');
        return;
      }

      if (!form.valor || Number(form.valor) <= 0) {
        alert('Informe um valor válido.');
        return;
      }

      setSaving(true);

      if (editingPedido?.id) {
        const { error } = await supabase
          .from('pedidos')
          .update({
            cliente_nome: form.cliente_nome.trim(),
            produto: form.produto.trim(),
            quantidade: Number(form.quantidade),
            valor: Number(form.valor),
            prazo: form.prazo || null,
            observacoes: form.observacoes.trim(),
            status: form.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPedido.id);

        if (error) throw error;
      } else {
        const numero = nextPedidoNumero(pedidos);

        const { error } = await supabase.from('pedidos').insert({
          numero,
          cliente_id: null,
          cliente_nome: form.cliente_nome.trim(),
          orcamento_id: null,
          orcamento_numero: null,
          produto: form.produto.trim(),
          quantidade: Number(form.quantidade),
          valor: Number(form.valor),
          status: form.status,
          prazo: form.prazo || null,
          observacoes: form.observacoes.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      closeForm();
      fetchPedidos();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao salvar pedido');
    } finally {
      setSaving(false);
    }
  }

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

  async function handleGerarProducao(pedido: PedidoRow) {
    try {
      if (!pedido.id) return;

      if (pedidosComOp.has(pedido.id)) {
        alert('Esse pedido já possui uma ordem de produção.');
        return;
      }

      setGerandoOpId(pedido.id);

      const payload = {
        pedido_id: pedido.id,
        pedido_numero: pedido.numero || 'Sem número',
        cliente_nome: pedido.cliente_nome || '',
        produto: pedido.produto || '',
        produto_nome: pedido.produto || '',
        quantidade: Number(pedido.quantidade || 0),
        status: 'Em produção',
        etapa: 'Aguardando',
        prioridade: 'Normal',
        prazo: pedido.prazo || null,
        progresso: 0,
        materiais_ok: false,
        custo_previsto: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error: insertError } = await supabase
        .from('ordens_producao')
        .insert(payload);

      if (insertError) throw insertError;

      const { error: updatePedidoError } = await supabase
        .from('pedidos')
        .update({
          status: 'Em Produção',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pedido.id);

      if (updatePedidoError) throw updatePedidoError;

      alert(`Produção gerada com sucesso para o pedido ${pedido.numero || ''}.`);
      fetchPedidos();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao gerar produção');
    } finally {
      setGerandoOpId(null);
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
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 flex-1">
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
              {fmt(stats.valorAberto)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <Target className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Margem alvo
          </span>
          <select
            value={margemAlvo}
            onChange={(e) => setMargemAlvo(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
          >
            <option value={20}>20%</option>
            <option value={25}>25%</option>
            <option value={30}>30%</option>
            <option value={35}>35%</option>
            <option value={40}>40%</option>
            <option value={45}>45%</option>
          </select>
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
            onClick={openNewForm}
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
            <table className="w-full min-w-[1850px] text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60">
                  {[
                    'Pedido',
                    'Cliente',
                    'Produto',
                    'Qtd',
                    'Venda',
                    'Preço Sugerido',
                    'Matéria-prima',
                    'Impressão',
                    'Acabamento',
                    'Operacional',
                    'Custo Total',
                    'Lucro',
                    'Margem',
                    'Etapa',
                    'Prioridade',
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

                  const jaTemOp = pedidosComOp.has(pedido.id);
                  const ordem = pedido.id ? ordensMap.get(pedido.id) : undefined;
                  const breakdown = pedido.id ? breakdownMap.get(pedido.id) : undefined;

                  const material = Number(breakdown?.material || 0);
                  const impressao = Number(breakdown?.impressao || 0);
                  const acabamento = Number(breakdown?.acabamento || 0);
                  const operacional = Number(breakdown?.operacional || 0);
                  const custoTotal = Number(breakdown?.total || 0);

                  const valorVenda = Number(pedido.valor || 0);
                  const precoSugerido = calculateSuggestedPrice(custoTotal, margemAlvo);
                  const lucroBruto = valorVenda - custoTotal;
                  const margem = valorVenda > 0 ? (lucroBruto / valorVenda) * 100 : 0;

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
                        {fmt(valorVenda)}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {jaTemOp ? fmt(precoSugerido) : '—'}
                      </td>

                      <td className="px-4 py-3 text-slate-900 dark:text-white">
                        {jaTemOp ? fmt(material) : '—'}
                      </td>

                      <td className="px-4 py-3 text-slate-900 dark:text-white">
                        {jaTemOp ? fmt(impressao) : '—'}
                      </td>

                      <td className="px-4 py-3 text-slate-900 dark:text-white">
                        {jaTemOp ? fmt(acabamento) : '—'}
                      </td>

                      <td className="px-4 py-3 text-slate-900 dark:text-white">
                        {jaTemOp ? fmt(operacional) : '—'}
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {jaTemOp ? fmt(custoTotal) : '—'}
                      </td>

                      <td className="px-4 py-3">
                        {jaTemOp ? (
                          <span className={`font-semibold ${lucroBruto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {fmt(lucroBruto)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {jaTemOp ? (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            margem >= margemAlvo
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                              : margem >= 10
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                          }`}>
                            {margem.toFixed(1)}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {ordem?.etapa || '—'}
                      </td>

                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {ordem?.prioridade || '—'}
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
                            onClick={() => openEditForm(pedido)}
                            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGerarProducao(pedido)}
                            disabled={jaTemOp || gerandoOpId === pedido.id}
                            className={`inline-flex items-center justify-center rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                              jaTemOp || gerandoOpId === pedido.id
                                ? 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                                : 'bg-violet-500 text-white hover:bg-violet-600'
                            }`}
                            title="Gerar produção"
                          >
                            <Workflow className="mr-1.5 h-4 w-4" />
                            {gerandoOpId === pedido.id ? 'Gerando...' : jaTemOp ? 'Já gerada' : 'Gerar Produção'}
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
                            <option>Em Acabamento</option>
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
                      colSpan={18}
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
          <div className="relative z-10 w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
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

            {(() => {
              const ordem = selectedPedido.id ? ordensMap.get(selectedPedido.id) : undefined;
              const breakdown = selectedPedido.id ? breakdownMap.get(selectedPedido.id) : undefined;

              const material = Number(breakdown?.material || 0);
              const impressao = Number(breakdown?.impressao || 0);
              const acabamento = Number(breakdown?.acabamento || 0);
              const operacional = Number(breakdown?.operacional || 0);
              const custoTotal = Number(breakdown?.total || 0);

              const valorVenda = Number(selectedPedido.valor || 0);
              const precoSugerido = calculateSuggestedPrice(custoTotal, margemAlvo);
              const lucroBruto = valorVenda - custoTotal;
              const margem = valorVenda > 0 ? (lucroBruto / valorVenda) * 100 : 0;

              return (
                <>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="erp-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Valor de venda
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {fmt(valorVenda)}
                      </p>
                    </div>

                    <div className="erp-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Custo total
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {fmt(custoTotal)}
                      </p>
                    </div>

                    <div className="erp-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Preço sugerido
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {fmt(precoSugerido)}
                      </p>
                    </div>

                    <div className="erp-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Lucro bruto
                      </p>
                      <p className={`mt-2 text-base font-semibold ${lucroBruto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {fmt(lucroBruto)}
                      </p>
                    </div>

                    <div className="erp-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Margem
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {margem.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="erp-card p-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-sky-500" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Matéria-prima
                        </p>
                      </div>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {fmt(material)}
                      </p>
                    </div>

                    <div className="erp-card p-4">
                      <div className="flex items-center gap-2">
                        <Printer className="h-4 w-4 text-violet-500" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Impressão
                        </p>
                      </div>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {fmt(impressao)}
                      </p>
                    </div>

                    <div className="erp-card p-4">
                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-amber-500" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Acabamento
                        </p>
                      </div>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {fmt(acabamento)}
                      </p>
                    </div>

                    <div className="erp-card p-4">
                      <div className="flex items-center gap-2">
                        <Cog className="h-4 w-4 text-emerald-500" />
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Operacional
                        </p>
                      </div>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {fmt(operacional)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="erp-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Produto
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {selectedPedido.produto || '—'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Quantidade: {Number(selectedPedido.quantidade || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div className="erp-card p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Produção
                      </p>
                      <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                        {ordem?.etapa || 'Não gerada'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Prioridade: {ordem?.prioridade || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 erp-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <BadgeDollarSign className="h-4 w-4 text-sky-500" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Leitura comercial
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      Com margem alvo de <span className="font-semibold">{margemAlvo}%</span>, o preço sugerido para este pedido é{' '}
                      <span className="font-semibold">{fmt(precoSugerido)}</span>. O valor de venda atual é{' '}
                      <span className="font-semibold">{fmt(valorVenda)}</span>.
                    </p>
                  </div>

                  <div className="mt-4 erp-card p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 text-emerald-500" />
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Observações
                      </p>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
                      {selectedPedido.observacoes?.trim() || 'Sem observações cadastradas.'}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeForm} />
          <div className="relative z-10 w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  {editingPedido ? 'Editar pedido' : 'Novo pedido'}
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {editingPedido ? editingPedido.numero || 'Pedido' : 'Cadastro de Pedido'}
                </h3>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-red-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Cliente
                </label>
                <input
                  value={form.cliente_nome}
                  onChange={(e) => updateForm('cliente_nome', e.target.value)}
                  placeholder="Digite o nome do cliente"
                  className="erp-input w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Produto
                </label>
                <input
                  value={form.produto}
                  onChange={(e) => updateForm('produto', e.target.value)}
                  placeholder="Digite o nome do produto"
                  className="erp-input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.quantidade}
                  onChange={(e) => updateForm('quantidade', e.target.value)}
                  placeholder="0"
                  className="erp-input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Valor de venda
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valor}
                  onChange={(e) => updateForm('valor', e.target.value)}
                  placeholder="0.00"
                  className="erp-input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Prazo
                </label>
                <input
                  type="date"
                  value={form.prazo}
                  onChange={(e) => updateForm('prazo', e.target.value)}
                  className="erp-input w-full"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => updateForm('status', e.target.value)}
                  className="erp-input w-full"
                >
                  <option>Aguardando</option>
                  <option>Em Andamento</option>
                  <option>Em Produção</option>
                  <option>Em Acabamento</option>
                  <option>Pronto</option>
                  <option>Entregue</option>
                  <option>Cancelado</option>
                </select>
              </div>

              <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-violet-500" />
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Precificação automática
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Margem alvo</span>
                    <select
                      value={margemAlvo}
                      onChange={(e) => setMargemAlvo(Number(e.target.value))}
                      className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value={20}>20%</option>
                      <option value={25}>25%</option>
                      <option value={30}>30%</option>
                      <option value={35}>35%</option>
                      <option value={40}>40%</option>
                      <option value={45}>45%</option>
                    </select>
                  </div>
                </div>

                {previewBreakdown ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Custo total</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {fmt(previewBreakdown.total)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Preço sugerido</p>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {fmt(precoSugeridoPreview)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Margem atual</p>
                        <p className={`mt-1 font-semibold ${
                          margemPreview >= margemAlvo
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : margemPreview >= 10
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {margemPreview.toFixed(1)}%
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Situação</p>
                        <p className={`mt-1 font-semibold ${
                          Number(form.valor || 0) >= precoSugeridoPreview
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {Number(form.valor || 0) >= precoSugeridoPreview
                            ? 'Preço ok'
                            : 'Preço abaixo'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-sky-500" />
                          <p className="text-xs text-slate-500 dark:text-slate-400">Matéria-prima</p>
                        </div>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {fmt(previewBreakdown.material)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                          <Printer className="h-4 w-4 text-violet-500" />
                          <p className="text-xs text-slate-500 dark:text-slate-400">Impressão</p>
                        </div>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {fmt(previewBreakdown.impressao)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                          <Scissors className="h-4 w-4 text-amber-500" />
                          <p className="text-xs text-slate-500 dark:text-slate-400">Acabamento</p>
                        </div>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {fmt(previewBreakdown.acabamento)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-3 dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                          <Cog className="h-4 w-4 text-emerald-500" />
                          <p className="text-xs text-slate-500 dark:text-slate-400">Operacional</p>
                        </div>
                        <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                          {fmt(previewBreakdown.operacional)}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Preencha produto e quantidade para calcular custo e preço sugerido.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Observações
                </label>
                <textarea
                  value={form.observacoes}
                  onChange={(e) => updateForm('observacoes', e.target.value)}
                  placeholder="Observações do pedido"
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-500/10"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                className="erp-button-secondary"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSavePedido}
                disabled={saving}
                className={`erp-button-primary ${saving ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : editingPedido ? 'Salvar Alterações' : 'Criar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
