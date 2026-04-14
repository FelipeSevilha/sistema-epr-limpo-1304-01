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
  cliente_nome?: string | null;
  produto?: string | null;
  quantidade?: number | null;
  valor?: number | null;
  status?: string | null;
  prazo?: string | null;
  observacoes?: string | null;
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoRow[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [clienteSearch, setClienteSearch] = useState('');
  const [showClienteList, setShowClienteList] = useState(false);
  const [margemAlvo, setMargemAlvo] = useState(30);

  async function fetchData() {
    const [ped, cli] = await Promise.all([
      supabase.from('pedidos').select('*'),
      supabase.from('clientes').select('*'),
    ]);

    setPedidos(ped.data || []);
    setClientes(cli.data || []);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openForm() {
    setForm({});
    setClienteSearch('');
    setFormOpen(true);
  }

  function updateForm(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  }

  async function salvar() {
    await supabase.from('pedidos').insert({
      ...form,
      cliente_nome: form.cliente_nome,
    });

    setFormOpen(false);
    fetchData();
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between">
        <input
          placeholder="Buscar..."
          className="erp-input"
          onChange={(e) => setSearch(e.target.value)}
        />

        <button onClick={openForm} className="erp-button-primary">
          <Plus /> Novo Pedido
        </button>
      </div>

      <div className="grid gap-4">
        {pedidos.map((p) => (
          <div key={p.id} className="erp-card p-4">
            <div className="flex justify-between">
              <div>
                <p className="font-bold">{p.cliente_nome}</p>
                <p>{p.produto}</p>
              </div>
              <div>{p.valor}</div>
            </div>
          </div>
        ))}
      </div>

      {formOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl w-[500px] space-y-4">

            <h2 className="text-xl font-bold">Novo Pedido</h2>

            {/* 🔥 AUTOCOMPLETE CLIENTE */}
            <div className="relative">
              <input
                value={clienteSearch}
                onChange={(e) => {
                  setClienteSearch(e.target.value);
                  setShowClienteList(true);
                }}
                placeholder="Digite o cliente"
                className="erp-input w-full"
              />

              {showClienteList && clienteSearch && (
                <div className="absolute z-50 w-full bg-white dark:bg-slate-900 border rounded-xl shadow">
                  {clientes
                    .filter((c) =>
                      (c.razao_social || '')
                        .toLowerCase()
                        .includes(clienteSearch.toLowerCase())
                    )
                    .map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          updateForm('cliente_nome', c.razao_social);
                          setClienteSearch(c.razao_social);
                          setShowClienteList(false);
                        }}
                        className="p-2 hover:bg-slate-100 cursor-pointer"
                      >
                        {c.razao_social}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <input
              placeholder="Produto"
              className="erp-input"
              onChange={(e) => updateForm('produto', e.target.value)}
            />

            <input
              placeholder="Valor"
              type="number"
              className="erp-input"
              onChange={(e) => updateForm('valor', e.target.value)}
            />

            {/* 🔥 MARGEM */}
            <select
              value={margemAlvo}
              onChange={(e) => setMargemAlvo(Number(e.target.value))}
              className="erp-input"
            >
              {Array.from({ length: 21 }, (_, i) => i * 5).map((v) => (
                <option key={v}>{v}%</option>
              ))}
            </select>

            <button onClick={salvar} className="erp-button-primary w-full">
              <Save /> Salvar Pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
