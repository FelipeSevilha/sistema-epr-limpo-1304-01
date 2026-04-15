'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Search,
  FileText,
  DollarSign,
  Clock3,
  CircleCheck,
  CircleX,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  Save,
  X,
  CheckCircle2,
  Package,
  Printer,
  Minus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Cliente = {
  id: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  contato_comercial?: string | null;
  telefone_comercial?: string | null;
  email_comercial?: string | null;
};

type OrcamentoItem = {
  id: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  total: number;
};

type Orcamento = {
  id: string;
  numero?: string | null;
  cliente_id?: string | null;
  cliente_nome?: string | null;
  produto?: string | null;
  descricao?: string | null;
  quantidade?: number | null;
  valor?: number | null;
  status?: string | null;
  motivo_perda?: string | null;
  observacoes?: string | null;
  vendedor?: string | null;
  origem?: string | null;
  validade?: string | null;
  itens_json?: OrcamentoItem[] | string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Pedido = {
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

type FormData = {
  cliente_id: string;
  cliente_nome: string;
  descricao: string;
  status: string;
  motivo_perda: string;
  observacoes: string;
  vendedor: string;
  origem: string;
  validade: string;
  itens: OrcamentoItem[];
};

const initialItem = (): OrcamentoItem => ({
  id: crypto.randomUUID(),
  descricao: '',
  quantidade: 1,
  valor_unitario: 0,
  total: 0,
});

const initialForm: FormData = {
  cliente_id: '',
  cliente_nome: '',
  descricao: '',
  status: 'Em aberto',
  motivo_perda: '',
  observacoes: '',
  vendedor: '',
  origem: '',
  validade: '',
  itens: [initialItem()],
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);

function formatDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(`${value}`.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

function nextNumero(orcamentos: Orcamento[]) {
  const numeros = orcamentos
    .map((o) => Number(String(o.numero || '').replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n) && n > 0);

  const max = numeros.length ? Math.max(...numeros) : 0;
  return `ORC-${String(max + 1).padStart(4, '0')}`;
}

function nextPedidoNumero(pedidos: Pedido[]) {
  const numeros = pedidos
    .map((p) => Number(String(p.numero || '').replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n) && n > 0);

  const max = numeros.length ? Math.max(...numeros) : 0;
  return `P-${String(max + 1).padStart(4, '0')}`;
}

function statusClass(status?: string | null) {
  const s = (status || '').toLowerCase();

  if (['aprovado', 'convertido'].includes(s)) {
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300';
  }

  if (['em aberto', 'aguardando retorno'].includes(s)) {
    return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300';
  }

  if (['perdido', 'cancelado'].includes(s)) {
    return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300';
  }

  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
}

function parseItens(orc: Orcamento): OrcamentoItem[] {
  if (Array.isArray(orc.itens_json) && orc.itens_json.length > 0) {
    return orc.itens_json.map((item, index) => ({
      id: item.id || `item-${index}`,
      descricao: item.descricao || '',
      quantidade: Number(item.quantidade || 0),
      valor_unitario: Number(item.valor_unitario || 0),
      total: Number(item.total || Number(item.quantidade || 0) * Number(item.valor_unitario || 0)),
    }));
  }

  if (typeof orc.itens_json === 'string' && orc.itens_json.trim()) {
    try {
      const parsed = JSON.parse(orc.itens_json);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any, index: number) => ({
          id: item.id || `item-${index}`,
          descricao: item.descricao || '',
          quantidade: Number(item.quantidade || 0),
          valor_unitario: Number(item.valor_unitario || 0),
          total: Number(item.total || Number(item.quantidade || 0) * Number(item.valor_unitario || 0)),
        }));
      }
    } catch {
      // ignora e usa fallback
    }
  }

  if (orc.produto || orc.valor || orc.quantidade) {
    const qtd = Number(orc.quantidade || 1);
    const total = Number(orc.valor || 0);
    return [
      {
        id: 'fallback-item',
        descricao: orc.produto || 'Item do orçamento',
        quantidade: qtd,
        valor_unitario: qtd > 0 ? total / qtd : total,
        total,
      },
    ];
  }

  return [];
}

function sanitizeHtml(text: string) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Orcamento | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Orcamento | null>(null);
  const [form, setForm] = useState<FormData>(initialForm);

  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteList, setShowClienteList] = useState(false);

  async function fetchData() {
    try {
      setLoading(true);

      const [orcRes, cliRes] = await Promise.all([
        supabase.from('orcamentos').select('*').order('created_at', { ascending: false }),
        supabase.from('clientes').select('*').order('razao_social', { ascending: true }),
      ]);

      setOrcamentos((orcRes.data as Orcamento[]) || []);
      setClientes((cliRes.data as Cliente[]) || []);
    } catch (err) {
      console.error(err);
      alert('Erro ao carregar orçamentos.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filtrados = useMemo(() => {
    return orcamentos.filter((orc) => {
      const texto = search.toLowerCase();
      return (
        String(orc.numero || '').toLowerCase().includes(texto) ||
        String(orc.cliente_nome || '').toLowerCase().includes(texto) ||
        String(orc.produto || '').toLowerCase().includes(texto) ||
        String(orc.status || '').toLowerCase().includes(texto) ||
        String(orc.vendedor || '').toLowerCase().includes(texto)
      );
    });
  }, [orcamentos, search]);

  const resumo = useMemo(() => {
    const total = orcamentos.length;
    const abertos = orcamentos.filter((o) =>
      ['Em aberto', 'Aguardando retorno'].includes(o.status || '')
    ).length;
    const aprovados = orcamentos.filter((o) =>
      ['Aprovado', 'Convertido'].includes(o.status || '')
    ).length;
    const perdidos = orcamentos.filter((o) => (o.status || '') === 'Perdido').length;
    const valorTotal = orcamentos.reduce((sum, o) => sum + Number(o.valor || 0), 0);

    return { total, abertos, aprovados, perdidos, valorTotal };
  }, [orcamentos]);

  const clientesFiltrados = useMemo(() => {
    const termo = clienteSearch.trim().toLowerCase();

    if (!termo) return clientes.slice(0, 8);

    return clientes
      .filter((c) => {
        const razao = (c.razao_social || '').toLowerCase();
        const fantasia = (c.nome_fantasia || '').toLowerCase();
        const email = (c.email_comercial || '').toLowerCase();
        return razao.includes(termo) || fantasia.includes(termo) || email.includes(termo);
      })
      .slice(0, 8);
  }, [clientes, clienteSearch]);

  const totalForm = useMemo(() => {
    return form.itens.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }, [form.itens]);

  function updateForm<K extends keyof FormData>(field: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateItem(itemId: string, field: keyof OrcamentoItem, value: string | number) {
    setForm((prev) => {
      const itens = prev.itens.map((item) => {
        if (item.id !== itemId) return item;

        const updated = { ...item, [field]: value };

        const quantidade = Number(updated.quantidade || 0);
        const valorUnitario = Number(updated.valor_unitario || 0);
        updated.total = quantidade * valorUnitario;

        return updated;
      });

      return { ...prev, itens };
    });
  }

  function addItem() {
    setForm((prev) => ({
      ...prev,
      itens: [...prev.itens, initialItem()],
    }));
  }

  function removeItem(itemId: string) {
    setForm((prev) => {
      const itens = prev.itens.filter((item) => item.id !== itemId);
      return {
        ...prev,
        itens: itens.length ? itens : [initialItem()],
      };
    });
  }

  function openNewDrawer() {
    setEditing(null);
    setForm(initialForm);
    setClienteSearch('');
    setShowClienteList(false);
    setDrawerOpen(true);
  }

  function openEditDrawer(orc: Orcamento) {
    setEditing(orc);
    setForm({
      cliente_id: orc.cliente_id || '',
      cliente_nome: orc.cliente_nome || '',
      descricao: orc.descricao || '',
      status: orc.status || 'Em aberto',
      motivo_perda: orc.motivo_perda || '',
      observacoes: orc.observacoes || '',
      vendedor: orc.vendedor || '',
      origem: orc.origem || '',
      validade: orc.validade || '',
      itens: (() => {
        const itens = parseItens(orc);
        return itens.length ? itens : [initialItem()];
      })(),
    });
    setClienteSearch(orc.cliente_nome || '');
    setShowClienteList(false);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditing(null);
    setForm(initialForm);
    setClienteSearch('');
    setShowClienteList(false);
  }

  function selecionarCliente(cliente: Cliente) {
    const nome = cliente.razao_social || cliente.nome_fantasia || 'Cliente';
    setForm((prev) => ({
      ...prev,
      cliente_id: cliente.id,
      cliente_nome: nome,
    }));
    setClienteSearch(nome);
    setShowClienteList(false);
  }

  function validarForm() {
    if (!form.cliente_nome.trim()) {
      alert('Informe o cliente.');
      return false;
    }

    const itensValidos = form.itens.filter(
      (item) => item.descricao.trim() && Number(item.quantidade) > 0 && Number(item.valor_unitario) >= 0
    );

    if (itensValidos.length === 0) {
      alert('Adicione pelo menos 1 item válido no orçamento.');
      return false;
    }

    return true;
  }

  async function handleSave() {
    if (!validarForm()) return;

    try {
      setSaving(true);

      const itens = form.itens
        .filter((item) => item.descricao.trim())
        .map((item) => ({
          ...item,
          quantidade: Number(item.quantidade || 0),
          valor_unitario: Number(item.valor_unitario || 0),
          total: Number(item.total || 0),
        }));

      const quantidadeTotal = itens.reduce((sum, item) => sum + Number(item.quantidade || 0), 0);
      const valorTotal = itens.reduce((sum, item) => sum + Number(item.total || 0), 0);
      const produtoPrincipal = itens[0]?.descricao || '';

      const payload = {
        cliente_id: form.cliente_id || null,
        cliente_nome: form.cliente_nome.trim(),
        produto: produtoPrincipal,
        descricao: form.descricao.trim(),
        quantidade: quantidadeTotal,
        valor: valorTotal,
        status: form.status,
        motivo_perda: form.motivo_perda.trim(),
        observacoes: form.observacoes.trim(),
        vendedor: form.vendedor.trim(),
        origem: form.origem.trim(),
        validade: form.validade || null,
        itens_json: itens,
        updated_at: new Date().toISOString(),
      };

      if (editing?.id) {
        const { error } = await supabase
          .from('orcamentos')
          .update(payload)
          .eq('id', editing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('orcamentos').insert({
          numero: nextNumero(orcamentos),
          ...payload,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      closeDrawer();
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao salvar orçamento.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmar = window.confirm('Deseja realmente excluir este orçamento?');
    if (!confirmar) return;

    try {
      const { error } = await supabase.from('orcamentos').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao excluir orçamento.');
    }
  }

  async function handleUpdateStatus(id: string, status: string) {
    try {
      const payload: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status !== 'Perdido') {
        payload.motivo_perda = '';
      }

      const { error } = await supabase.from('orcamentos').update(payload).eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao atualizar status.');
    }
  }

  async function handleConverter(orc: Orcamento) {
    try {
      const confirmar = window.confirm(
        `Converter o orçamento ${orc.numero || ''} em pedido?`
      );
      if (!confirmar) return;

      const pedidosRes = await supabase.from('pedidos').select('*');
      const pedidos = (pedidosRes.data as Pedido[]) || [];

      const { error: insertError } = await supabase.from('pedidos').insert({
        numero: nextPedidoNumero(pedidos),
        cliente_id: orc.cliente_id || null,
        cliente_nome: orc.cliente_nome || '',
        orcamento_id: orc.id,
        orcamento_numero: orc.numero || '',
        produto: orc.produto || '',
        quantidade: Number(orc.quantidade || 0),
        valor: Number(orc.valor || 0),
        status: 'Aguardando',
        prazo: null,
        observacoes: orc.observacoes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('orcamentos')
        .update({
          status: 'Convertido',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orc.id);

      if (updateError) throw updateError;

      alert('Orçamento convertido em pedido com sucesso.');
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao converter orçamento.');
    }
  }

  function handleGerarPDF(orc: Orcamento) {
    const itens = parseItens(orc);
    const popup = window.open('', '_blank', 'width=900,height=700');

    if (!popup) {
      alert('Permita pop-ups para gerar o PDF.');
      return;
    }

    const total = itens.reduce((sum, item) => sum + Number(item.total || 0), 0);

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8" />
          <title>Orçamento ${sanitizeHtml(orc.numero || '')}</title>
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              padding: 32px;
              color: #111827;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 24px;
            }
            .title {
              font-size: 28px;
              font-weight: 700;
              margin: 0 0 8px 0;
            }
            .muted {
              color: #6b7280;
              font-size: 13px;
              line-height: 1.5;
            }
            .box {
              border: 1px solid #e5e7eb;
              border-radius: 16px;
              padding: 16px;
              margin-bottom: 16px;
            }
            .box h3 {
              margin: 0 0 12px 0;
              font-size: 15px;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 12px;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 10px;
              font-size: 13px;
              text-align: left;
            }
            th {
              background: #f9fafb;
            }
            .right {
              text-align: right;
            }
            .total {
              margin-top: 16px;
              display: flex;
              justify-content: flex-end;
              font-size: 18px;
              font-weight: 700;
            }
            .footer {
              margin-top: 32px;
              font-size: 12px;
              color: #6b7280;
            }
            @media print {
              body {
                padding: 16px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">Orçamento ${sanitizeHtml(orc.numero || '')}</h1>
              <div class="muted">
                Data: ${sanitizeHtml(formatDate(orc.created_at))}<br/>
                Validade: ${sanitizeHtml(formatDate(orc.validade))}
              </div>
            </div>
            <div class="muted" style="text-align:right;">
              Status: ${sanitizeHtml(orc.status || '—')}<br/>
              Vendedor: ${sanitizeHtml(orc.vendedor || '—')}<br/>
              Origem: ${sanitizeHtml(orc.origem || '—')}
            </div>
          </div>

          <div class="box">
            <h3>Cliente</h3>
            <div class="muted" style="font-size:14px;color:#111827;">
              ${sanitizeHtml(orc.cliente_nome || '—')}
            </div>
          </div>

          <div class="box">
            <h3>Itens do orçamento</h3>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th class="right">Quantidade</th>
                  <th class="right">Valor unitário</th>
                  <th class="right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itens
                  .map(
                    (item) => `
                  <tr>
                    <td>${sanitizeHtml(item.descricao)}</td>
                    <td class="right">${sanitizeHtml(String(item.quantidade))}</td>
                    <td class="right">${sanitizeHtml(fmt(item.valor_unitario))}</td>
                    <td class="right">${sanitizeHtml(fmt(item.total))}</td>
                  </tr>
                `
                  )
                  .join('')}
              </tbody>
            </table>

            <div class="total">
              Total geral: ${sanitizeHtml(fmt(total))}
            </div>
          </div>

          <div class="box">
            <h3>Observações</h3>
            <div class="muted" style="font-size:14px;color:#111827;">
              ${sanitizeHtml(orc.descricao || '')}<br/><br/>
              ${sanitizeHtml(orc.observacoes || 'Sem observações.')}
            </div>
          </div>

          <div class="footer">
            Documento gerado pelo sistema de orçamentos.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `;

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
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
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Orçamentos
            </p>
            <FileText className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.total}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Em aberto
            </p>
            <Clock3 className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.abertos}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Aprovados
            </p>
            <CircleCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.aprovados}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Perdidos
            </p>
            <CircleX className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{resumo.perdidos}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Valor total
            </p>
            <DollarSign className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(resumo.valorTotal)}</p>
        </div>
      </section>

      <section className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar orçamento, cliente, item ou vendedor..."
              className="erp-input w-96 pl-10"
            />
          </div>

          <button
            type="button"
            onClick={openNewDrawer}
            className="erp-button-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1450px] text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60">
                {[
                  'Orçamento',
                  'Cliente',
                  'Item principal',
                  'Qtd itens',
                  'Valor',
                  'Vendedor',
                  'Origem',
                  'Validade',
                  'Status',
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
              {filtrados.map((orc) => {
                const itens = parseItens(orc);

                return (
                  <tr
                    key={orc.id}
                    className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  >
                    <td className="px-4 py-3 font-semibold text-sky-600 dark:text-sky-400">
                      {orc.numero || '—'}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelected(orc)}
                        className="text-left font-medium text-slate-900 dark:text-white"
                      >
                        {orc.cliente_nome || '—'}
                      </button>
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {itens[0]?.descricao || orc.produto || '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {itens.length}
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      {fmt(Number(orc.valor || 0))}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {orc.vendedor || '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {orc.origem || '—'}
                    </td>

                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(orc.validade)}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(orc.status)}`}>
                        {orc.status || '—'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelected(orc)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditDrawer(orc)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-violet-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-violet-400"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGerarPDF(orc)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-emerald-400"
                          title="Gerar PDF"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        <select
                          value={orc.status || 'Em aberto'}
                          onChange={(e) => handleUpdateStatus(orc.id, e.target.value)}
                          className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          <option>Em aberto</option>
                          <option>Aguardando retorno</option>
                          <option>Aprovado</option>
                          <option>Perdido</option>
                          <option>Convertido</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleConverter(orc)}
                          disabled={['Convertido'].includes(orc.status || '')}
                          className={`inline-flex items-center justify-center rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                            ['Convertido'].includes(orc.status || '')
                              ? 'cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                              : 'bg-emerald-500 text-white hover:bg-emerald-600'
                          }`}
                          title="Converter em pedido"
                        >
                          <Package className="mr-1.5 h-4 w-4" />
                          {orc.status === 'Convertido' ? 'Convertido' : 'Converter'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(orc.id)}
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

              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    Nenhum orçamento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Orçamento
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {selected.numero || '—'}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selected.cliente_nome || '—'}
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
                <p className="text-xs text-slate-500 dark:text-slate-400">Itens</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {parseItens(selected).length}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Valor total</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {fmt(Number(selected.valor || 0))}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Validade</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {formatDate(selected.validade)}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                <div className="mt-2">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(selected.status)}`}>
                    {selected.status || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 erp-card overflow-hidden">
              <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Itens do orçamento
                </h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/60">
                      {['Descrição', 'Quantidade', 'Valor unitário', 'Total'].map((h) => (
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
                    {parseItens(selected).map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{item.descricao}</td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                          {Number(item.quantidade || 0).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                          {fmt(Number(item.valor_unitario || 0))}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                          {fmt(Number(item.total || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="erp-card p-5">
                <h4 className="mb-3 text-base font-bold text-slate-900 dark:text-white">
                  Informações comerciais
                </h4>
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                  <p><span className="font-semibold">Vendedor:</span> {selected.vendedor || '—'}</p>
                  <p><span className="font-semibold">Origem:</span> {selected.origem || '—'}</p>
                  <p><span className="font-semibold">Validade:</span> {formatDate(selected.validade)}</p>
                  <p><span className="font-semibold">Criado em:</span> {formatDate(selected.created_at)}</p>
                </div>
              </div>

              <div className="erp-card p-5">
                <h4 className="mb-3 text-base font-bold text-slate-900 dark:text-white">
                  Motivo da perda / observações
                </h4>
                <div className="space-y-3 text-sm text-slate-700 dark:text-slate-200">
                  <p><span className="font-semibold">Motivo da perda:</span> {selected.motivo_perda || '—'}</p>
                  <p><span className="font-semibold">Descrição geral:</span> {selected.descricao || '—'}</p>
                  <p><span className="font-semibold">Observações:</span> {selected.observacoes || '—'}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleGerarPDF(selected)}
                className="erp-button-secondary"
              >
                <Printer className="mr-2 h-4 w-4" />
                Gerar PDF
              </button>

              <button
                type="button"
                onClick={() => openEditDrawer(selected)}
                className="erp-button-secondary"
              >
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </button>

              <button
                type="button"
                onClick={() => handleConverter(selected)}
                disabled={selected.status === 'Convertido'}
                className={`erp-button-primary ${selected.status === 'Convertido' ? 'cursor-not-allowed opacity-70' : ''}`}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {selected.status === 'Convertido' ? 'Já convertido' : 'Converter em pedido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={closeDrawer} />

          <div className="h-full w-full max-w-[900px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    Orçamentos
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    {editing ? 'Editar Orçamento' : 'Novo Orçamento'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Cadastro completo do orçamento
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeDrawer}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-red-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Dados do orçamento
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Cliente
                    </label>

                    <div className="relative">
                      <input
                        value={clienteSearch}
                        onFocus={() => setShowClienteList(true)}
                        onChange={(e) => {
                          const value = e.target.value;
                          setClienteSearch(value);
                          setShowClienteList(true);
                          setForm((prev) => ({
                            ...prev,
                            cliente_id: '',
                            cliente_nome: value,
                          }));
                        }}
                        placeholder="Digite o nome do cliente"
                        className="erp-input w-full"
                      />
                    </div>

                    {showClienteList && clienteSearch.trim() && clientesFiltrados.length > 0 && (
                      <div className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        {clientesFiltrados.map((cliente) => {
                          const nome = cliente.razao_social || cliente.nome_fantasia || 'Cliente';
                          return (
                            <button
                              key={cliente.id}
                              type="button"
                              onClick={() => selecionarCliente(cliente)}
                              className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800 last:border-b-0"
                            >
                              <div className="font-medium">{nome}</div>
                              {cliente.email_comercial ? (
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                  {cliente.email_comercial}
                                </div>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Descrição geral
                    </label>
                    <textarea
                      rows={3}
                      value={form.descricao}
                      onChange={(e) => updateForm('descricao', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Resumo geral do orçamento"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Vendedor
                    </label>
                    <input
                      value={form.vendedor}
                      onChange={(e) => updateForm('vendedor', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Nome do vendedor"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Origem
                    </label>
                    <input
                      value={form.origem}
                      onChange={(e) => updateForm('origem', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Instagram, WhatsApp, site..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Validade
                    </label>
                    <input
                      type="date"
                      value={form.validade}
                      onChange={(e) => updateForm('validade', e.target.value)}
                      className="erp-input w-full"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={form.status}
                        onChange={(e) => updateForm('status', e.target.value)}
                        className="erp-input w-full appearance-none"
                      >
                        <option>Em aberto</option>
                        <option>Aguardando retorno</option>
                        <option>Aprovado</option>
                        <option>Perdido</option>
                        <option>Convertido</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  {form.status === 'Perdido' && (
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                        Motivo da perda
                      </label>
                      <input
                        value={form.motivo_perda}
                        onChange={(e) => updateForm('motivo_perda', e.target.value)}
                        className="erp-input w-full"
                        placeholder="Preço, prazo, concorrência..."
                      />
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Observações
                    </label>
                    <textarea
                      rows={4}
                      value={form.observacoes}
                      onChange={(e) => updateForm('observacoes', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Observações internas do orçamento"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Itens do orçamento
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Adicione quantos itens precisar
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addItem}
                    className="erp-button-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar item
                  </button>
                </div>

                <div className="space-y-4">
                  {form.itens.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          Item {index + 1}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Minus className="mr-1 h-4 w-4" />
                          Remover
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-4">
                        <div className="md:col-span-4">
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Descrição do item
                          </label>
                          <input
                            value={item.descricao}
                            onChange={(e) => updateItem(item.id, 'descricao', e.target.value)}
                            className="erp-input w-full"
                            placeholder="Ex: Cartão de visita 4x4"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Quantidade
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(e) => updateItem(item.id, 'quantidade', Number(e.target.value))}
                            className="erp-input w-full"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Valor unitário
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.valor_unitario}
                            onChange={(e) => updateItem(item.id, 'valor_unitario', Number(e.target.value))}
                            className="erp-input w-full"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Total
                          </label>
                          <div className="erp-input flex items-center bg-slate-50 dark:bg-slate-950">
                            {fmt(item.total)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex justify-end">
                  <div className="rounded-2xl bg-slate-100 px-4 py-3 text-right dark:bg-slate-800">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total do orçamento</p>
                    <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                      {fmt(totalForm)}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDrawer}
                  className="erp-button-secondary"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={`erp-button-primary ${saving ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : editing ? 'Atualizar Orçamento' : 'Cadastrar Orçamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
