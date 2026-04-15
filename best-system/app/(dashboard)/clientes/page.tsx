'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Building2,
  BadgeDollarSign,
  TrendingUp,
  Users,
  Eye,
  Plus,
  Pencil,
  X,
  Save,
  MapPin,
  Briefcase,
  Phone,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Cliente = {
  id: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  ie?: string | null;
  setor?: string | null;
  status?: boolean | null;

  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;

  contato_comercial?: string | null;
  cargo_comercial?: string | null;
  telefone_comercial?: string | null;
  whatsapp_comercial?: string | null;
  email_comercial?: string | null;

  contato_financeiro?: string | null;
  cargo_financeiro?: string | null;
  telefone_financeiro?: string | null;
  whatsapp_financeiro?: string | null;
  email_financeiro?: string | null;

  limite_credito?: number | null;
  condicao_pagamento?: string | null;
  desconto_padrao?: number | null;
  tabela_preco?: string | null;
  prazo_medio?: string | null;
  observacao_comercial?: string | null;

  origem?: string | null;
  responsavel?: string | null;
  tipo?: string | null;
  segmento?: string | null;
  classificacao?: string | null;
  tags?: string | null;
  observacoes?: string | null;

  ativo?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
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
  contatoComercial: string;
  telefoneComercial: string;
  emailComercial: string;
  contatoFinanceiro: string;
  telefoneFinanceiro: string;
  emailFinanceiro: string;
  cidade: string;
  ativo: boolean;
  pedidos: number;
  faturamento: number;
  ticketMedio: number;
  statusEntrega: number;
  responsavel: string;
  limiteCredito: number;
  condicaoPagamento: string;
};

type ClienteFormData = {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  ie: string;
  setor: string;
  status: boolean;

  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;

  contato_comercial: string;
  cargo_comercial: string;
  telefone_comercial: string;
  whatsapp_comercial: string;
  email_comercial: string;

  contato_financeiro: string;
  cargo_financeiro: string;
  telefone_financeiro: string;
  whatsapp_financeiro: string;
  email_financeiro: string;

  limite_credito: string;
  condicao_pagamento: string;
  desconto_padrao: string;
  tabela_preco: string;
  prazo_medio: string;
  observacao_comercial: string;

  origem: string;
  responsavel: string;
  tipo: string;
  segmento: string;
  classificacao: string;
  tags: string;
  observacoes: string;
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);

const initialForm: ClienteFormData = {
  razao_social: '',
  nome_fantasia: '',
  cnpj: '',
  ie: '',
  setor: '',
  status: true,

  cep: '',
  endereco: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: 'SP',

  contato_comercial: '',
  cargo_comercial: '',
  telefone_comercial: '',
  whatsapp_comercial: '',
  email_comercial: '',

  contato_financeiro: '',
  cargo_financeiro: '',
  telefone_financeiro: '',
  whatsapp_financeiro: '',
  email_financeiro: '',

  limite_credito: '',
  condicao_pagamento: '',
  desconto_padrao: '',
  tabela_preco: '',
  prazo_medio: '',
  observacao_comercial: '',

  origem: '',
  responsavel: '',
  tipo: 'Empresa',
  segmento: '',
  classificacao: '',
  tags: '',
  observacoes: '',
};

function formatCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }

  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

function formatCEP(value: string) {
  return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ClienteView | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [form, setForm] = useState<ClienteFormData>(initialForm);

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

  useEffect(() => {
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
        contatoComercial: cliente.contato_comercial || '—',
        telefoneComercial: cliente.telefone_comercial || '—',
        emailComercial: cliente.email_comercial || '—',
        contatoFinanceiro: cliente.contato_financeiro || '—',
        telefoneFinanceiro: cliente.telefone_financeiro || '—',
        emailFinanceiro: cliente.email_financeiro || '—',
        cidade: [cliente.cidade, cliente.estado || cliente.uf].filter(Boolean).join(' / ') || '—',
        ativo: Boolean(cliente.status ?? cliente.ativo ?? true),
        pedidos: pedidosCliente.length,
        faturamento,
        ticketMedio,
        statusEntrega,
        responsavel: cliente.responsavel || '—',
        limiteCredito: Number(cliente.limite_credito || 0),
        condicaoPagamento: cliente.condicao_pagamento || '—',
      };
    });
  }, [clientes, pedidos]);

  const filtrados = useMemo(() => {
    return clientesView
      .filter((cliente) => {
        return (
          cliente.nome.toLowerCase().includes(search.toLowerCase()) ||
          cliente.contatoComercial.toLowerCase().includes(search.toLowerCase()) ||
          cliente.emailComercial.toLowerCase().includes(search.toLowerCase()) ||
          cliente.contatoFinanceiro.toLowerCase().includes(search.toLowerCase()) ||
          cliente.emailFinanceiro.toLowerCase().includes(search.toLowerCase())
        );
      })
      .sort((a, b) => b.faturamento - a.faturamento);
  }, [clientesView, search]);

  const resumo = useMemo(() => {
    const total = clientesView.length;
    const ativos = clientesView.filter((c) => c.ativo).length;
    const faturamento = clientesView.reduce((sum, c) => sum + c.faturamento, 0);
    const ticketMedio =
      total > 0
        ? faturamento / Math.max(clientesView.reduce((sum, c) => sum + c.pedidos, 0), 1)
        : 0;

    return { total, ativos, faturamento, ticketMedio };
  }, [clientesView]);

  function updateForm<K extends keyof ClienteFormData>(field: K, value: ClienteFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function openNewDrawer() {
    setEditingCliente(null);
    setForm(initialForm);
    setDrawerOpen(true);
  }

  function openEditDrawer(clienteId: string) {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (!cliente) return;

    setEditingCliente(cliente);
    setForm({
      razao_social: cliente.razao_social || '',
      nome_fantasia: cliente.nome_fantasia || '',
      cnpj: cliente.cnpj || '',
      ie: cliente.ie || '',
      setor: cliente.setor || '',
      status: Boolean(cliente.status ?? cliente.ativo ?? true),

      cep: cliente.cep || '',
      endereco: cliente.endereco || '',
      numero: cliente.numero || '',
      complemento: cliente.complemento || '',
      bairro: cliente.bairro || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || 'SP',

      contato_comercial: cliente.contato_comercial || '',
      cargo_comercial: cliente.cargo_comercial || '',
      telefone_comercial: cliente.telefone_comercial || '',
      whatsapp_comercial: cliente.whatsapp_comercial || '',
      email_comercial: cliente.email_comercial || '',

      contato_financeiro: cliente.contato_financeiro || '',
      cargo_financeiro: cliente.cargo_financeiro || '',
      telefone_financeiro: cliente.telefone_financeiro || '',
      whatsapp_financeiro: cliente.whatsapp_financeiro || '',
      email_financeiro: cliente.email_financeiro || '',

      limite_credito: cliente.limite_credito ? String(cliente.limite_credito) : '',
      condicao_pagamento: cliente.condicao_pagamento || '',
      desconto_padrao: cliente.desconto_padrao ? String(cliente.desconto_padrao) : '',
      tabela_preco: cliente.tabela_preco || '',
      prazo_medio: cliente.prazo_medio || '',
      observacao_comercial: cliente.observacao_comercial || '',

      origem: cliente.origem || '',
      responsavel: cliente.responsavel || '',
      tipo: cliente.tipo || 'Empresa',
      segmento: cliente.segmento || '',
      classificacao: cliente.classificacao || '',
      tags: cliente.tags || '',
      observacoes: cliente.observacoes || '',
    });

    setDrawerOpen(true);
  }

  async function buscarCEP() {
    const cep = form.cep.replace(/\D/g, '');
    if (cep.length !== 8) {
      alert('Digite um CEP válido.');
      return;
    }

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();

      if (data.erro) {
        alert('CEP não encontrado.');
        return;
      }

      setForm((prev) => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
    } catch {
      alert('Erro ao buscar CEP.');
    }
  }

  function validarForm() {
    if (!form.razao_social.trim()) {
      alert('Razão social é obrigatória.');
      return false;
    }

    if (form.cnpj && form.cnpj.length < 18) {
      alert('CNPJ inválido.');
      return false;
    }

    if (form.email_comercial && !form.email_comercial.includes('@')) {
      alert('E-mail comercial inválido.');
      return false;
    }

    if (form.email_financeiro && !form.email_financeiro.includes('@')) {
      alert('E-mail financeiro inválido.');
      return false;
    }

    return true;
  }

  async function handleSaveCliente() {
    if (!validarForm()) return;

    try {
      setSaving(true);

      const payload = {
        razao_social: form.razao_social.trim(),
        nome_fantasia: form.nome_fantasia.trim(),
        cnpj: form.cnpj.trim(),
        ie: form.ie.trim(),
        setor: form.setor.trim(),
        status: form.status,
        ativo: form.status,

        cep: form.cep.trim(),
        endereco: form.endereco.trim(),
        numero: form.numero.trim(),
        complemento: form.complemento.trim(),
        bairro: form.bairro.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim(),

        contato_comercial: form.contato_comercial.trim(),
        cargo_comercial: form.cargo_comercial.trim(),
        telefone_comercial: form.telefone_comercial.trim(),
        whatsapp_comercial: form.whatsapp_comercial.trim(),
        email_comercial: form.email_comercial.trim(),

        contato_financeiro: form.contato_financeiro.trim(),
        cargo_financeiro: form.cargo_financeiro.trim(),
        telefone_financeiro: form.telefone_financeiro.trim(),
        whatsapp_financeiro: form.whatsapp_financeiro.trim(),
        email_financeiro: form.email_financeiro.trim(),

        limite_credito: form.limite_credito ? Number(form.limite_credito) : 0,
        condicao_pagamento: form.condicao_pagamento.trim(),
        desconto_padrao: form.desconto_padrao ? Number(form.desconto_padrao) : 0,
        tabela_preco: form.tabela_preco.trim(),
        prazo_medio: form.prazo_medio.trim(),
        observacao_comercial: form.observacao_comercial.trim(),

        origem: form.origem.trim(),
        responsavel: form.responsavel.trim(),
        tipo: form.tipo.trim(),
        segmento: form.segmento.trim(),
        classificacao: form.classificacao.trim(),
        tags: form.tags.trim(),
        observacoes: form.observacoes.trim(),

        updated_at: new Date().toISOString(),
      };

      if (editingCliente?.id) {
        const { error } = await supabase
          .from('clientes')
          .update(payload)
          .eq('id', editingCliente.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('clientes').insert({
          ...payload,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      setDrawerOpen(false);
      setEditingCliente(null);
      setForm(initialForm);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Erro ao salvar cliente.');
    } finally {
      setSaving(false);
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
              placeholder="Buscar cliente, contato, e-mail ou responsável..."
              className="erp-input w-96 pl-10"
            />
          </div>

          <button
            type="button"
            onClick={openNewDrawer}
            className="erp-button-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1500px] text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60">
                {[
                  'Cliente',
                  'Cidade',
                  'Comercial',
                  'Financeiro',
                  'Responsável',
                  'Limite',
                  'Condição',
                  'Pedidos',
                  'Faturamento',
                  'Ticket',
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
              {filtrados.map((cliente) => (
                <tr
                  key={cliente.id}
                  className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(cliente)}
                      className="text-left"
                    >
                      <p className="font-semibold text-slate-900 dark:text-white">{cliente.nome}</p>
                    </button>
                  </td>

                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{cliente.cidade}</td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{cliente.contatoComercial}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{cliente.telefoneComercial}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{cliente.emailComercial}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white">{cliente.contatoFinanceiro}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{cliente.telefoneFinanceiro}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{cliente.emailFinanceiro}</p>
                  </td>

                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{cliente.responsavel}</td>

                  <td className="px-4 py-3 text-slate-900 dark:text-white">{fmt(cliente.limiteCredito)}</td>

                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{cliente.condicaoPagamento}</td>

                  <td className="px-4 py-3 text-slate-900 dark:text-white">{cliente.pedidos}</td>

                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{fmt(cliente.faturamento)}</td>

                  <td className="px-4 py-3 text-slate-900 dark:text-white">{fmt(cliente.ticketMedio)}</td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        cliente.ativo
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {cliente.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(cliente)}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                        title="Ver detalhes"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditDrawer(cliente.id)}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-violet-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-violet-400"
                        title="Editar cliente"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    Nenhum cliente encontrado.
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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
                  Limite
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {fmt(selected.limiteCredito)}
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

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="erp-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-sky-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Contato Comercial
                  </p>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {selected.contatoComercial} • {selected.telefoneComercial} • {selected.emailComercial}
                </p>
              </div>

              <div className="erp-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Contato Financeiro
                  </p>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  {selected.contatoFinanceiro} • {selected.telefoneFinanceiro} • {selected.emailFinanceiro}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />

          <div className="h-full w-full max-w-[760px] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                    Clientes
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Cadastro master premium do cliente
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-red-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-sky-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Dados da Empresa</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Razão Social
                    </label>
                    <input
                      value={form.razao_social}
                      onChange={(e) => updateForm('razao_social', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Digite a razão social"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Nome Fantasia
                    </label>
                    <input
                      value={form.nome_fantasia}
                      onChange={(e) => updateForm('nome_fantasia', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Digite o nome fantasia"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      CNPJ
                    </label>
                    <input
                      value={form.cnpj}
                      onChange={(e) => updateForm('cnpj', formatCNPJ(e.target.value))}
                      className="erp-input w-full"
                      placeholder="00.000.000/0000-00"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Inscrição Estadual
                    </label>
                    <input
                      value={form.ie}
                      onChange={(e) => updateForm('ie', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Digite a IE"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Setor
                    </label>
                    <input
                      value={form.setor}
                      onChange={(e) => updateForm('setor', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Ex: Compras, Financeiro..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Tipo
                    </label>
                    <select
                      value={form.tipo}
                      onChange={(e) => updateForm('tipo', e.target.value)}
                      className="erp-input w-full"
                    >
                      <option>Empresa</option>
                      <option>Pessoa</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Status do cliente</span>
                    <button
                      type="button"
                      onClick={() => updateForm('status', !form.status)}
                      className={`relative ml-auto inline-flex h-7 w-14 items-center rounded-full transition ${
                        form.status ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                          form.status ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-sm font-semibold ${form.status ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                      {form.status ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-violet-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Endereço Completo</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      CEP
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={form.cep}
                        onChange={(e) => updateForm('cep', formatCEP(e.target.value))}
                        className="erp-input w-full"
                        placeholder="00000-000"
                      />
                      <button type="button" onClick={buscarCEP} className="erp-button-primary whitespace-nowrap">
                        Buscar CEP
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Rua / Endereço
                    </label>
                    <input
                      value={form.endereco}
                      onChange={(e) => updateForm('endereco', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Digite a rua"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Número
                    </label>
                    <input
                      value={form.numero}
                      onChange={(e) => updateForm('numero', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Digite o número"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Complemento
                    </label>
                    <input
                      value={form.complemento}
                      onChange={(e) => updateForm('complemento', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Sala, bloco, referência..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Bairro
                    </label>
                    <input
                      value={form.bairro}
                      onChange={(e) => updateForm('bairro', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Digite o bairro"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Cidade
                    </label>
                    <input
                      value={form.cidade}
                      onChange={(e) => updateForm('cidade', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Digite a cidade"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Estado
                    </label>
                    <input
                      value={form.estado}
                      onChange={(e) => updateForm('estado', e.target.value)}
                      className="erp-input w-full"
                      placeholder="UF"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-amber-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Contato Comercial</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Nome</label>
                    <input
                      value={form.contato_comercial}
                      onChange={(e) => updateForm('contato_comercial', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Nome do contato comercial"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Cargo</label>
                    <input
                      value={form.cargo_comercial}
                      onChange={(e) => updateForm('cargo_comercial', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Cargo"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Telefone</label>
                    <input
                      value={form.telefone_comercial}
                      onChange={(e) => updateForm('telefone_comercial', formatPhone(e.target.value))}
                      className="erp-input w-full"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">WhatsApp</label>
                    <input
                      value={form.whatsapp_comercial}
                      onChange={(e) => updateForm('whatsapp_comercial', formatPhone(e.target.value))}
                      className="erp-input w-full"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">E-mail</label>
                    <input
                      value={form.email_comercial}
                      onChange={(e) => updateForm('email_comercial', e.target.value)}
                      className="erp-input w-full"
                      placeholder="email@empresa.com"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Contato Financeiro</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Nome</label>
                    <input
                      value={form.contato_financeiro}
                      onChange={(e) => updateForm('contato_financeiro', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Nome do contato financeiro"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Cargo</label>
                    <input
                      value={form.cargo_financeiro}
                      onChange={(e) => updateForm('cargo_financeiro', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Cargo"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Telefone</label>
                    <input
                      value={form.telefone_financeiro}
                      onChange={(e) => updateForm('telefone_financeiro', formatPhone(e.target.value))}
                      className="erp-input w-full"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">WhatsApp</label>
                    <input
                      value={form.whatsapp_financeiro}
                      onChange={(e) => updateForm('whatsapp_financeiro', formatPhone(e.target.value))}
                      className="erp-input w-full"
                      placeholder="(11) 99999-9999"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">E-mail</label>
                    <input
                      value={form.email_financeiro}
                      onChange={(e) => updateForm('email_financeiro', e.target.value)}
                      className="erp-input w-full"
                      placeholder="financeiro@empresa.com"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                  <BadgeDollarSign className="h-4 w-4 text-cyan-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Dados Comerciais</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Limite de Crédito
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.limite_credito}
                      onChange={(e) => updateForm('limite_credito', e.target.value)}
                      className="erp-input w-full"
                      placeholder="0,00"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Condição de Pagamento
                    </label>
                    <input
                      value={form.condicao_pagamento}
                      onChange={(e) => updateForm('condicao_pagamento', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Ex: 28 dias, 30/60, à vista"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Desconto Padrão %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.desconto_padrao}
                      onChange={(e) => updateForm('desconto_padrao', e.target.value)}
                      className="erp-input w-full"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Tabela de Preço
                    </label>
                    <input
                      value={form.tabela_preco}
                      onChange={(e) => updateForm('tabela_preco', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Ex: padrão, atacado, especial"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Prazo Médio
                    </label>
                    <input
                      value={form.prazo_medio}
                      onChange={(e) => updateForm('prazo_medio', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Ex: 7 dias"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Observação Comercial
                    </label>
                    <textarea
                      rows={3}
                      value={form.observacao_comercial}
                      onChange={(e) => updateForm('observacao_comercial', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Informações comerciais importantes"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-rose-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Controle Interno</h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Origem</label>
                    <input
                      value={form.origem}
                      onChange={(e) => updateForm('origem', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Instagram, indicação, site..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Responsável</label>
                    <input
                      value={form.responsavel}
                      onChange={(e) => updateForm('responsavel', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Vendedor responsável"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Segmento</label>
                    <input
                      value={form.segmento}
                      onChange={(e) => updateForm('segmento', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Ex: indústria, varejo..."
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Classificação</label>
                    <input
                      value={form.classificacao}
                      onChange={(e) => updateForm('classificacao', e.target.value)}
                      className="erp-input w-full"
                      placeholder="VIP, recorrente, potencial..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Tags</label>
                    <input
                      value={form.tags}
                      onChange={(e) => updateForm('tags', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Separadas por vírgula"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">Observações Gerais</label>
                    <textarea
                      rows={4}
                      value={form.observacoes}
                      onChange={(e) => updateForm('observacoes', e.target.value)}
                      className="erp-input w-full"
                      placeholder="Informações adicionais do cliente"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="erp-button-secondary"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleSaveCliente}
                  disabled={saving}
                  className={`erp-button-primary ${saving ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Salvando...' : editingCliente ? 'Atualizar Cliente' : 'Cadastrar Cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
