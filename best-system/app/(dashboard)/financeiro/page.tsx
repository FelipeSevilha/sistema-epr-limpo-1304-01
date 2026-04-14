'use client'

import { useMemo, useState } from 'react'

type Centro = 'Felipe Pessoal' | 'Gráfica Itu' | 'Gráfica SP'
type Natureza = 'entrada' | 'saida'
type Status = 'pendente' | 'pago' | 'atrasado'

type Lancamento = {
  id: number
  descricao: string
  categoria: string
  centro: Centro
  natureza: Natureza
  vencimento: string
  valor: number
  status: Status
}

const centros: Centro[] = ['Felipe Pessoal', 'Gráfica Itu', 'Gráfica SP']

const statusStyle: Record<Status, string> = {
  pendente: 'bg-amber-100 text-amber-700 border-amber-200',
  pago: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  atrasado: 'bg-red-100 text-red-700 border-red-200',
}

const centroStyle: Record<Centro, string> = {
  'Felipe Pessoal': 'bg-violet-100 text-violet-700 border-violet-200',
  'Gráfica Itu': 'bg-sky-100 text-sky-700 border-sky-200',
  'Gráfica SP': 'bg-indigo-100 text-indigo-700 border-indigo-200',
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)

export default function FinanceiroPage() {
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    descricao: '',
    categoria: '',
    centro: 'Gráfica Itu' as Centro,
    natureza: 'saida' as Natureza,
    vencimento: '',
    valor: '',
    status: 'pendente' as Status,
  })

  const [lancamentos, setLancamentos] = useState<Lancamento[]>([
    {
      id: 1,
      descricao: 'Aluguel do galpão',
      categoria: 'Despesa fixa',
      centro: 'Gráfica Itu',
      natureza: 'saida',
      vencimento: '2026-04-10',
      valor: 3200,
      status: 'pago',
    },
    {
      id: 2,
      descricao: 'Compra de papel couchê',
      categoria: 'Insumos',
      centro: 'Gráfica SP',
      natureza: 'saida',
      vencimento: '2026-04-15',
      valor: 1850,
      status: 'pendente',
    },
    {
      id: 3,
      descricao: 'Pagamento pessoal emergencial',
      categoria: 'Pessoal',
      centro: 'Felipe Pessoal',
      natureza: 'saida',
      vencimento: '2026-04-08',
      valor: 420,
      status: 'pago',
    },
    {
      id: 4,
      descricao: 'Recebimento pedido cliente XPTO',
      categoria: 'Receita',
      centro: 'Gráfica Itu',
      natureza: 'entrada',
      vencimento: '2026-04-20',
      valor: 5400,
      status: 'pendente',
    },
  ])

  const resumo = useMemo(() => {
    const entradas = lancamentos
      .filter((item) => item.natureza === 'entrada')
      .reduce((acc, item) => acc + item.valor, 0)

    const saidas = lancamentos
      .filter((item) => item.natureza === 'saida')
      .reduce((acc, item) => acc + item.valor, 0)

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      felipe: lancamentos
        .filter((item) => item.centro === 'Felipe Pessoal')
        .reduce((acc, item) => acc + (item.natureza === 'entrada' ? item.valor : -item.valor), 0),
      itu: lancamentos
        .filter((item) => item.centro === 'Gráfica Itu')
        .reduce((acc, item) => acc + (item.natureza === 'entrada' ? item.valor : -item.valor), 0),
      sp: lancamentos
        .filter((item) => item.centro === 'Gráfica SP')
        .reduce((acc, item) => acc + (item.natureza === 'entrada' ? item.valor : -item.valor), 0),
    }
  }, [lancamentos])

  const adicionarLancamento = () => {
    if (
      !form.descricao.trim() ||
      !form.categoria.trim() ||
      !form.vencimento ||
      !form.valor
    ) {
      return
    }

    const novo: Lancamento = {
      id: Date.now(),
      descricao: form.descricao,
      categoria: form.categoria,
      centro: form.centro,
      natureza: form.natureza,
      vencimento: form.vencimento,
      valor: Number(form.valor),
      status: form.status,
    }

    setLancamentos((prev) => [novo, ...prev])

    setForm({
      descricao: '',
      categoria: '',
      centro: 'Gráfica Itu',
      natureza: 'saida',
      vencimento: '',
      valor: '',
      status: 'pendente',
    })

    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Financeiro</h1>
          <p className="text-sm text-slate-500 mt-1">
            Controle visual das despesas e receitas da operação.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="h-11 px-5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-sm transition"
        >
          {showForm ? 'Fechar' : 'Novo lançamento'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
            Entradas
          </p>
          <h2 className="text-2xl font-bold text-emerald-600 mt-2">
            {formatCurrency(resumo.entradas)}
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
            Saídas
          </p>
          <h2 className="text-2xl font-bold text-red-500 mt-2">
            {formatCurrency(resumo.saidas)}
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
            Saldo geral
          </p>
          <h2
            className={`text-2xl font-bold mt-2 ${
              resumo.saldo >= 0 ? 'text-sky-600' : 'text-red-500'
            }`}
          >
            {formatCurrency(resumo.saldo)}
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">
            Lançamentos
          </p>
          <h2 className="text-2xl font-bold text-slate-800 mt-2">
            {lancamentos.length}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Felipe Pessoal</span>
            <span className="text-xs px-2 py-1 rounded-full border bg-violet-100 text-violet-700 border-violet-200">
              Centro
            </span>
          </div>
          <p className="text-2xl font-bold mt-3 text-slate-800">
            {formatCurrency(resumo.felipe)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Gráfica Itu</span>
            <span className="text-xs px-2 py-1 rounded-full border bg-sky-100 text-sky-700 border-sky-200">
              Centro
            </span>
          </div>
          <p className="text-2xl font-bold mt-3 text-slate-800">
            {formatCurrency(resumo.itu)}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Gráfica SP</span>
            <span className="text-xs px-2 py-1 rounded-full border bg-indigo-100 text-indigo-700 border-indigo-200">
              Centro
            </span>
          </div>
          <p className="text-2xl font-bold mt-3 text-slate-800">
            {formatCurrency(resumo.sp)}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Novo lançamento</h2>
            <span className="text-xs text-slate-400">
              Preencha os dados da movimentação
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Tipo de despesa / lançamento
              </label>
              <input
                value={form.descricao}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Ex: aluguel, combustível, compra de papel..."
                className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Categoria
              </label>
              <input
                value={form.categoria}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, categoria: e.target.value }))
                }
                placeholder="Ex: despesa fixa, insumos, pessoal, receita..."
                className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Centro
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {centros.map((centro) => (
                  <button
                    key={centro}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, centro }))
                    }
                    className={`h-12 rounded-xl border text-sm font-semibold transition ${
                      form.centro === centro
                        ? 'border-sky-500 bg-sky-50 text-sky-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {centro}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Natureza
              </label>
              <select
                value={form.natureza}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    natureza: e.target.value as Natureza,
                  }))
                }
                className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="saida">Saída</option>
                <option value="entrada">Entrada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Vencimento
              </label>
              <input
                type="date"
                value={form.vencimento}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, vencimento: e.target.value }))
                }
                className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Valor
              </label>
              <input
                type="number"
                value={form.valor}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, valor: e.target.value }))
                }
                placeholder="0,00"
                className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as Status,
                  }))
                }
                className="w-full h-12 rounded-xl border border-slate-200 px-4 outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={adicionarLancamento}
              className="h-12 px-6 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold transition"
            >
              Salvar lançamento
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Lançamentos</h2>
          <span className="text-sm text-slate-500">
            Visual mais limpo e organizado
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {lancamentos.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-slate-500">
              Nenhum lançamento ainda.
            </div>
          )}

          {lancamentos.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    {item.descricao}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">{item.categoria}</p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full border text-xs font-semibold ${statusStyle[item.status]}`}
                >
                  {item.status}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`px-3 py-1 rounded-full border text-xs font-semibold ${centroStyle[item.centro]}`}
                >
                  {item.centro}
                </span>

                <span
                  className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                    item.natureza === 'entrada'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-red-100 text-red-700 border-red-200'
                  }`}
                >
                  {item.natureza === 'entrada' ? 'Entrada' : 'Saída'}
                </span>

                <span className="px-3 py-1 rounded-full border text-xs font-semibold bg-slate-100 text-slate-700 border-slate-200">
                  Vencimento: {item.vencimento}
                </span>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                    Valor
                  </p>
                  <p
                    className={`text-2xl font-bold ${
                      item.natureza === 'entrada'
                        ? 'text-emerald-600'
                        : 'text-red-500'
                    }`}
                  >
                    {formatCurrency(item.valor)}
                  </p>
                </div>

                <div className="text-sm text-slate-400">
                  #{item.id}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
