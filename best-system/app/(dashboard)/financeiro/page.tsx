'use client'

import { useState } from 'react'

type Lancamento = {
  id: number
  descricao: string
  valor: number
  tipo: 'entrada' | 'saida'
  categoria: 'Felipe' | 'Itu' | 'SP'
  data: string
}

export default function FinanceiroPage() {
  const [lista, setLista] = useState<Lancamento[]>([])
  const [form, setForm] = useState({
    descricao: '',
    valor: '',
    tipo: 'saida',
    categoria: 'Itu',
  })

  const adicionar = () => {
    if (!form.descricao || !form.valor) return

    const novo: Lancamento = {
      id: Date.now(),
      descricao: form.descricao,
      valor: Number(form.valor),
      tipo: form.tipo as any,
      categoria: form.categoria as any,
      data: new Date().toISOString(),
    }

    setLista([...lista, novo])

    setForm({
      descricao: '',
      valor: '',
      tipo: 'saida',
      categoria: 'Itu',
    })
  }

  const total = lista.reduce((acc, item) => {
    return item.tipo === 'entrada'
      ? acc + item.valor
      : acc - item.valor
  }, 0)

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Financeiro</h1>

      {/* RESUMO */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <p>Total Geral</p>
          <h2 className="text-xl font-bold">R$ {total.toFixed(2)}</h2>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="font-semibold">Novo Lançamento</h2>

        <input
          placeholder="Descrição"
          className="w-full border p-2 rounded"
          value={form.descricao}
          onChange={(e) =>
            setForm({ ...form, descricao: e.target.value })
          }
        />

        <input
          placeholder="Valor"
          type="number"
          className="w-full border p-2 rounded"
          value={form.valor}
          onChange={(e) =>
            setForm({ ...form, valor: e.target.value })
          }
        />

        <select
          className="w-full border p-2 rounded"
          value={form.tipo}
          onChange={(e) =>
            setForm({ ...form, tipo: e.target.value })
          }
        >
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>

        <select
          className="w-full border p-2 rounded"
          value={form.categoria}
          onChange={(e) =>
            setForm({ ...form, categoria: e.target.value })
          }
        >
          <option value="Felipe">Felipe Pessoal</option>
          <option value="Itu">Gráfica Itu</option>
          <option value="SP">Gráfica SP</option>
        </select>

        <button
          onClick={adicionar}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Adicionar
        </button>
      </div>

      {/* LISTA */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-4">Lançamentos</h2>

        {lista.length === 0 && <p>Nenhum lançamento ainda</p>}

        {lista.map((item) => (
          <div
            key={item.id}
            className="flex justify-between border-b py-2"
          >
            <div>
              <p>{item.descricao}</p>
              <span className="text-sm text-gray-500">
                {item.categoria}
              </span>
            </div>

            <p
              className={
                item.tipo === 'entrada'
                  ? 'text-green-600'
                  : 'text-red-600'
              }
            >
              R$ {item.valor.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
