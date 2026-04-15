'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { calcularScore } from '@/lib/cliente-inteligencia';
import { Eye, Plus, X } from 'lucide-react';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [financeiro, setFinanceiro] = useState<any[]>([]);

  const [open, setOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null);

  /* =========================
     LOAD
  ========================= */

  async function load() {
    const [c, p, f] = await Promise.all([
      supabase.from('clientes').select('*'),
      supabase.from('pedidos').select('*'),
      supabase.from('contas_receber').select('*'),
    ]);

    setClientes(c.data || []);
    setPedidos(p.data || []);
    setFinanceiro(f.data || []);
  }

  useEffect(() => {
    load();
  }, []);

  /* =========================
     ABRIR HISTÓRICO
  ========================= */

  function abrirCliente(c: any) {
    setClienteSelecionado(c);
    setOpen(true);
  }

  /* =========================
     RENDER
  ========================= */

  return (
    <div className="p-6 space-y-6">

      <div className="flex justify-between">
        <h1 className="text-xl font-bold">Clientes</h1>
      </div>

      {/* LISTA */}
      <div className="grid grid-cols-3 gap-4">

        {clientes.map((c) => (
          <div key={c.id} className="erp-card p-4 space-y-2">

            <h3 className="font-bold">{c.razao_social}</h3>

            <button
              onClick={() => abrirCliente(c)}
              className="erp-button-secondary flex gap-2"
            >
              <Eye size={14} />
              Ver histórico
            </button>

          </div>
        ))}
      </div>

      {/* SIDEBAR HISTÓRICO */}
      {open && clienteSelecionado && (() => {

        const pedidosCliente = pedidos.filter(
          (p) => p.cliente_nome === clienteSelecionado.razao_social
        );

        const financeiroCliente = financeiro.filter(
          (f) => f.cliente_nome === clienteSelecionado.razao_social
        );

        const faturamento = pedidosCliente.reduce(
          (acc, p) => acc + (p.valor || 0),
          0
        );

        const emAberto = financeiroCliente
          .filter((f) => f.status !== 'pago')
          .reduce((acc, f) => acc + (f.valor || 0), 0);

        const score = calcularScore({
          faturamento,
          pedidos: pedidosCliente.length,
          emAberto,
        });

        return (
          <div className="fixed inset-0 z-50 flex">

            <div
              className="flex-1 bg-black/40"
              onClick={() => setOpen(false)}
            />

            <div className="w-[600px] bg-white p-6 overflow-auto">

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {clienteSelecionado.razao_social}
                </h2>

                <button onClick={() => setOpen(false)}>
                  <X />
                </button>
              </div>

              {/* RESUMO */}
              <div className="mb-6 space-y-2 text-sm">

                <div><strong>Faturamento:</strong> R$ {faturamento}</div>
                <div className="text-red-500">
                  <strong>Em aberto:</strong> R$ {emAberto}
                </div>

                <div>
                  <strong>Score:</strong> {score.score} ({score.nivel})
                </div>

              </div>

              {/* PEDIDOS */}
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Pedidos</h3>

                {pedidosCliente.map((p) => (
                  <div key={p.id} className="border p-2 rounded mb-2 text-sm">
                    #{p.id} - R$ {p.valor} - {p.status}
                  </div>
                ))}
              </div>

              {/* FINANCEIRO */}
              <div>
                <h3 className="font-semibold mb-2">Financeiro</h3>

                {financeiroCliente.map((f) => (
                  <div key={f.id} className="border p-2 rounded mb-2 text-sm">
                    {f.descricao} - R$ {f.valor} - {f.status}
                  </div>
                ))}
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
