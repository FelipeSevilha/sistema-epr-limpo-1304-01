'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [financeiro, setFinanceiro] = useState<any[]>([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>({});

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
     MÉTRICAS
  ========================= */

  function getStats(cliente: any) {
    const pedidosCliente = pedidos.filter(
      (p) => p.cliente_nome === cliente.razao_social
    );

    const faturamento = pedidosCliente.reduce(
      (acc, p) => acc + (p.valor || 0),
      0
    );

    const aberto = financeiro
      .filter(
        (f) =>
          f.cliente_nome === cliente.razao_social &&
          f.status !== 'pago'
      )
      .reduce((acc, f) => acc + (f.valor || 0), 0);

    return {
      pedidos: pedidosCliente.length,
      faturamento,
      ticket:
        pedidosCliente.length > 0
          ? faturamento / pedidosCliente.length
          : 0,
      aberto,
    };
  }

  function getBadge(faturamento: number) {
    if (faturamento > 20000) return 'VIP';
    if (faturamento > 5000) return 'Alto Valor';
    return 'Normal';
  }

  /* =========================
     CRUD
  ========================= */

  function novo() {
    setEditing(null);
    setForm({});
    setOpen(true);
  }

  function editar(c: any) {
    setEditing(c);
    setForm(c);
    setOpen(true);
  }

  async function salvar() {
    if (editing) {
      await supabase
        .from('clientes')
        .update(form)
        .eq('id', editing.id);
    } else {
      await supabase.from('clientes').insert({
        ...form,
        created_at: new Date().toISOString(),
      });
    }

    setOpen(false);
    load();
  }

  async function excluir(id: string) {
    if (!confirm('Excluir cliente?')) return;

    await supabase.from('clientes').delete().eq('id', id);
    load();
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>

        <button onClick={novo} className="erp-button-primary flex gap-2">
          <Plus size={16} />
          Novo Cliente
        </button>
      </div>

      {/* GRID */}
      <div className="grid grid-cols-3 gap-4">

        {clientes.map((c) => {
          const stats = getStats(c);
          const badge = getBadge(stats.faturamento);

          return (
            <div
              key={c.id}
              className="erp-card p-4 space-y-3 relative"
            >

              {/* ALERTA */}
              {stats.aberto > 0 && (
                <div className="absolute top-2 right-2 text-red-500">
                  <AlertTriangle size={16} />
                </div>
              )}

              {/* HEADER */}
              <div className="flex justify-between items-center">
                <h3 className="font-bold">{c.razao_social}</h3>

                <span className="text-xs bg-slate-200 px-2 py-1 rounded">
                  {badge}
                </span>
              </div>

              {/* CONTATO */}
              <div className="text-sm text-slate-500">
                {c.telefone_comercial}
              </div>

              {/* MÉTRICAS */}
              <div className="grid grid-cols-2 gap-2 text-xs">

                <div>
                  <strong>Pedidos:</strong> {stats.pedidos}
                </div>

                <div>
                  <strong>Ticket:</strong>{' '}
                  R$ {stats.ticket.toFixed(0)}
                </div>

                <div>
                  <strong>Faturamento:</strong>{' '}
                  R$ {stats.faturamento.toFixed(0)}
                </div>

                <div className="text-red-500">
                  <strong>Em aberto:</strong>{' '}
                  R$ {stats.aberto.toFixed(0)}
                </div>

              </div>

              {/* AÇÕES */}
              <div className="flex gap-2 pt-2">

                <button
                  onClick={() => editar(c)}
                  className="erp-button-secondary"
                >
                  <Pencil size={14} />
                </button>

                <button
                  onClick={() => excluir(c.id)}
                  className="erp-button-secondary text-red-500"
                >
                  <Trash2 size={14} />
                </button>

              </div>

            </div>
          );
        })}
      </div>

      {/* SIDEBAR */}
      {open && (
        <div className="fixed inset-0 z-50 flex">

          <div
            className="flex-1 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="w-[520px] bg-white p-6">

            <h2 className="text-xl font-bold mb-4">
              {editing ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>

            <input
              placeholder="Razão Social"
              className="erp-input mb-2"
              value={form.razao_social || ''}
              onChange={(e) =>
                setForm({ ...form, razao_social: e.target.value })
              }
            />

            <input
              placeholder="Telefone"
              className="erp-input mb-2"
              value={form.telefone_comercial || ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  telefone_comercial: e.target.value,
                })
              }
            />

            <button
              onClick={salvar}
              className="erp-button-primary w-full"
            >
              {editing ? 'Atualizar' : 'Cadastrar'}
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
