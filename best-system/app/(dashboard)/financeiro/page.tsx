'use client'

import { useMemo, useState } from 'react'

type Subcategoria = 'Felipe Pessoal' | 'Gráfica Itu' | 'Gráfica SP'
type Tipo = 'Entrada' | 'Saída'
type Status = 'Pendente' | 'Pago' | 'Vencido'

type Lancamento = {
  id: number
  descricao: string
  subcategoria: Subcategoria
  categoria: string
  vencimento: string
  valor: number
  status: Status
  tipo: Tipo
}

const meses = [
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
]

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

export default function FinanceiroPage() {
  const [abaPrincipal, setAbaPrincipal] = useState<'Mensal' | 'Anual' | 'Metas Financeiras'>('Mensal')
  const [abaSecundaria, setAbaSecundaria] = useState<'Contas a Pagar' | 'Contas a Receber' | 'Fluxo de Caixa'>('Contas a Pagar')
  const [mesSelecionado, setMesSelecionado] = useState('Janeiro')
  const [anoSelecionado, setAnoSelecionado] = useState('2026')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [form, setForm] = useState({
    descricao: '',
    subcategoria: 'Gráfica Itu' as Subcategoria,
    categoria: '',
    vencimento: '',
    valor: '',
    status: 'Pendente' as Status,
    tipo: 'Saída' as Tipo,
  })

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([
    {
      id: 1,
      descricao: 'Manutenção Impressora Heidelberg',
      subcategoria: 'Gráfica Itu',
      categoria: 'Manutenção',
      vencimento: '05/09/2024',
      valor: 1200,
      status: 'Vencido',
      tipo: 'Saída',
    },
    {
      id: 2,
      descricao: 'Internet e Telefone',
      subcategoria: 'Gráfica SP',
      categoria: 'Despesas Fixas',
      vencimento: '10/09/2024',
      valor: 480,
      status: 'Pago',
      tipo: 'Saída',
    },
    {
      id: 3,
      descricao: 'Papel Couchê 150g - Papel Total',
      subcategoria: 'Gráfica Itu',
      categoria: 'Matéria-prima',
      vencimento: '15/09/2024',
      valor: 8200,
      status: 'Pendente',
      tipo: 'Saída',
    },
    {
      id: 4,
      descricao: 'Tinta UV - Gráfica Supply',
      subcategoria: 'Gráfica SP',
      categoria: 'Insumos',
      vencimento: '18/09/2024',
      valor: 3400,
      status: 'Pendente',
      tipo: 'Saída',
    },
    {
      id: 5,
      descricao: 'Aluguel - Imóvel Comercial',
      subcategoria: 'Gráfica Itu',
      categoria: 'Despesas Fixas',
      vencimento: '20/09/2024',
      valor: 5500,
      status: 'Pendente',
      tipo: 'Saída',
    },
    {
      id: 6,
      descricao: 'Pagamento pessoal emergencial',
      subcategoria: 'Felipe Pessoal',
      categoria: 'Pessoal',
      vencimento: '22/09/2024',
      valor: 650,
      status: 'Pendente',
      tipo: 'Saída',
    },
  ])

  const resumo = useMemo(() => {
    const faturamento = lancamentos
      .filter((item) => item.tipo === 'Entrada')
      .reduce((acc, item) => acc + item.valor, 0)

    const custos = lancamentos
      .filter((item) => item.tipo === 'Saída')
      .reduce((acc, item) => acc + item.valor, 0)

    const lucro = faturamento - custos

    return {
      faturamento,
      custos,
      lucro,
      saldoCaixa: 6500 + lucro,
    }
  }, [lancamentos])

  const adicionarLancamento = () => {
    if (!form.descricao || !form.categoria || !form.vencimento || !form.valor) return

    const novo: Lancamento = {
      id: Date.now(),
      descricao: form.descricao,
      subcategoria: form.subcategoria,
      categoria: form.categoria,
      vencimento: form.vencimento,
      valor: Number(form.valor),
      status: form.status,
      tipo: form.tipo,
    }

    setLancamentos((prev) => [novo, ...prev])

    setForm({
      descricao: '',
      subcategoria: 'Gráfica Itu',
      categoria: '',
      vencimento: '',
      valor: '',
      status: 'Pendente',
      tipo: 'Saída',
    })

    setMostrarFormulario(false)
  }

  const totalPendente = lancamentos
    .filter((item) => item.status === 'Pendente')
    .reduce((acc, item) => acc + item.valor, 0)

  const badgeStatus = (status: Status) => {
    if (status === 'Pago') return 'bg-emerald-100 text-emerald-700'
    if (status === 'Vencido') return 'bg-red-100 text-red-700'
    return 'bg-amber-100 text-amber-700'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Financeiro</h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestão financeira com visão mensal, anual e metas.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
          {(['Mensal', 'Anual', 'Metas Financeiras'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setAbaPrincipal(item)}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition ${
                abaPrincipal === item
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={mesSelecionado}
            onChange={(e) => setMesSelecionado(e.target.value)}
            className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium"
          >
            {meses.map((mes) => (
              <option key={mes}>{mes}</option>
            ))}
          </select>

          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium"
          >
            <option>2024</option>
            <option>2025</option>
            <option>2026</option>
            <option>2027</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Faturamento</p>
          <h2 className="text-3xl font-bold text-slate-800 mt-3">
            {formatCurrency(resumo.faturamento)}
          </h2>
          <p className="text-sm text-slate-400 mt-2">{mesSelecionado}/{anoSelecionado}</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Custos</p>
          <h2 className="text-3xl font-bold text-red-500 mt-3">
            {formatCurrency(resumo.custos)}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            {resumo.faturamento > 0 ? `${((resumo.custos / resumo.faturamento) * 100).toFixed(1)}% do faturamento` : 'Sem entradas'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lucro</p>
          <h2 className={`text-3xl font-bold mt-3 ${resumo.lucro >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {formatCurrency(resumo.lucro)}
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            {resumo.faturamento > 0 ? `Margem ${((resumo.lucro / resumo.faturamento) * 100).toFixed(1)}%` : 'Sem cálculo'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saldo Caixa</p>
          <h2 className="text-3xl font-bold text-slate-800 mt-3">
            {formatCurrency(resumo.saldoCaixa)}
          </h2>
          <p className="text-sm text-slate-400 mt-2">Saldo acumulado</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5">
          <div className="flex flex-wrap gap-2">
            {(['Contas a Pagar', 'Contas a Receber', 'Fluxo de Caixa'] as const).map((item) => (
              <button
                key={item}
                onClick={() => setAbaSecundaria(item)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  abaSecundaria === item
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="h-11 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold transition"
          >
            {mostrarFormulario ? 'Fechar' : 'Novo lançamento'}
          </button>
        </div>

        {mostrarFormulario && (
          <div className="px-5 pt-5">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
              <h3 className="text-lg font-bold text-slate-800">Adicionar lançamento</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Descrição
                  </label>
                  <input
                    value={form.descricao}
                    onChange={(e) => setForm((prev) => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Ex: aluguel, combustível, papel..."
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Subcategoria
                  </label>
                  <select
                    value={form.subcategoria}
                    onChange={(e) => setForm((prev) => ({ ...prev, subcategoria: e.target.value as Subcategoria }))}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-white"
                  >
                    <option>Felipe Pessoal</option>
                    <option>Gráfica Itu</option>
                    <option>Gráfica SP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Categoria
                  </label>
                  <input
                    value={form.categoria}
                    onChange={(e) => setForm((prev) => ({ ...prev, categoria: e.target.value }))}
                    placeholder="Ex: insumos, manutenção, pessoal..."
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Vencimento
                  </label>
                  <input
                    type="date"
                    value={form.vencimento}
                    onChange={(e) => setForm((prev) => ({ ...prev, vencimento: e.target.value }))}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Valor
                  </label>
                  <input
                    type="number"
                    value={form.valor}
                    onChange={(e) => setForm((prev) => ({ ...prev, valor: e.target.value }))}
                    placeholder="0,00"
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as Status }))}
                    className="w-full h-11 rounded-xl border border-slate-200 px-4 bg-white"
                  >
                    <option>Pendente</option>
                    <option>Pago</option>
                    <option>Vencido</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={adicionarLancamento}
                  className="h-11 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold transition"
                >
                  Adicionar lançamento
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-3 font-semibold">Descrição</th>
                  <th className="pb-3 font-semibold">Subcategoria</th>
                  <th className="pb-3 font-semibold">Categoria</th>
                  <th className="pb-3 font-semibold">Vencimento</th>
                  <th className="pb-3 font-semibold">Valor</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-4 font-medium text-slate-800">{item.descricao}</td>
                    <td className="py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {item.subcategoria}
                      </span>
                    </td>
                    <td className="py-4 text-slate-600">{item.categoria}</td>
                    <td className="py-4 text-slate-600">{item.vencimento}</td>
                    <td className="py-4 font-semibold text-slate-800">
                      {formatCurrency(item.valor)}
                    </td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeStatus(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4">
            <p className="text-sm font-semibold text-slate-500">
              Total pendente:{' '}
              <span className="text-red-500">{formatCurrency(totalPendente)}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
