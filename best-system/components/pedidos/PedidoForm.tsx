'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PedidoForm({ onSuccess }: any) {
  const [clientes, setClientes] = useState<any[]>([]);
  const [clienteBusca, setClienteBusca] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);

  const [produto, setProduto] = useState('');
  const [quantidade, setQuantidade] = useState(0);
  const [valor, setValor] = useState(0);
  const [margem, setMargem] = useState(30); // AGORA 0-100
  const [prazo, setPrazo] = useState('');

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    const { data } = await supabase.from('clientes').select('*');
    setClientes(data || []);
  }

  const clientesFiltrados = clientes.filter((c) =>
    (c.razao_social || '')
      .toLowerCase()
      .includes(clienteBusca.toLowerCase())
  );

  function selecionarCliente(cliente: any) {
    setClienteSelecionado(cliente);
    setClienteBusca(cliente.razao_social);
  }

  async function salvarPedido() {
    if (!clienteSelecionado) {
      alert('Selecione um cliente!');
      return;
    }

    await supabase.from('pedidos').insert({
      numero: `P-${Date.now()}`,
      cliente_id: clienteSelecionado.id,
      cliente_nome: clienteSelecionado.razao_social,
      produto,
      quantidade,
      valor,
      status: 'Aguardando',
      prazo,
    });

    alert('Pedido criado!');
    onSuccess();
  }

  return (
    <div className="space-y-4">

      {/* CLIENTE AUTOCOMPLETE */}
      <div>
        <label>Cliente</label>
        <input
          value={clienteBusca}
          onChange={(e) => {
            setClienteBusca(e.target.value);
            setClienteSelecionado(null);
          }}
          placeholder="Digite o nome do cliente..."
          className="erp-input w-full"
        />

        {clienteBusca && !clienteSelecionado && (
          <div className="bg-white border rounded mt-1 max-h-40 overflow-y-auto">
            {clientesFiltrados.map((c) => (
              <div
                key={c.id}
                onClick={() => selecionarCliente(c)}
                className="p-2 hover:bg-gray-100 cursor-pointer"
              >
                {c.razao_social}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PRODUTO */}
      <input
        placeholder="Produto"
        value={produto}
        onChange={(e) => setProduto(e.target.value)}
        className="erp-input w-full"
      />

      {/* QUANTIDADE */}
      <input
        type="number"
        placeholder="Quantidade"
        value={quantidade}
        onChange={(e) => setQuantidade(Number(e.target.value))}
        className="erp-input w-full"
      />

      {/* VALOR */}
      <input
        type="number"
        placeholder="Valor"
        value={valor}
        onChange={(e) => setValor(Number(e.target.value))}
        className="erp-input w-full"
      />

      {/* MARGEM CORRIGIDA */}
      <div>
        <label>Margem (%)</label>
        <input
          type="range"
          min={0}
          max={100}
          value={margem}
          onChange={(e) => setMargem(Number(e.target.value))}
          className="w-full"
        />
        <p>{margem}%</p>
      </div>

      {/* PRAZO */}
      <input
        type="date"
        value={prazo}
        onChange={(e) => setPrazo(e.target.value)}
        className="erp-input w-full"
      />

      <button
        onClick={salvarPedido}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Criar Pedido
      </button>
    </div>
  );
}
