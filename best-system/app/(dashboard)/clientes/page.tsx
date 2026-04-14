'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Eye, Pencil, Save, X } from 'lucide-react';

type ClienteRow = {
  id: string;
  razao_social?: string;
  nome_fantasia?: string;

  contato_financeiro?: string;
  telefone_financeiro?: string;
  email_financeiro?: string;

  contato_compras?: string;
  telefone_compras?: string;
  email_compras?: string;

  ativo?: boolean;
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClienteRow | null>(null);

  const [form, setForm] = useState<any>({
    razao_social: '',
    nome_fantasia: '',

    contato_financeiro: '',
    telefone_financeiro: '',
    email_financeiro: '',

    contato_compras: '',
    telefone_compras: '',
    email_compras: '',
  });

  async function fetchClientes() {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .order('razao_social');

    setClientes(data || []);
  }

  useEffect(() => {
    fetchClientes();
  }, []);

  function openNovo() {
    setEditing(null);
    setForm({
      razao_social: '',
      nome_fantasia: '',
      contato_financeiro: '',
      telefone_financeiro: '',
      email_financeiro: '',
      contato_compras: '',
      telefone_compras: '',
      email_compras: '',
    });
    setFormOpen(true);
  }

  function openEditar(cliente: ClienteRow) {
    setEditing(cliente);
    setForm(cliente);
    setFormOpen(true);
  }

  async function salvar() {
    if (!form.razao_social) {
      alert('Razão social obrigatória');
      return;
    }

    if (editing) {
      await supabase.from('clientes').update(form).eq('id', editing.id);
    } else {
      await supabase.from('clientes').insert({
        ...form,
        ativo: true,
        created_at: new Date().toISOString(),
      });
    }

    setFormOpen(false);
    fetchClientes();
  }

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Clientes</h1>

        <button onClick={openNovo} className="erp-button-primary flex gap-2">
          <Plus className="h-4 w-4" />
          Novo Cliente
        </button>
      </div>

      {/* LISTA */}
      <div className="erp-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900">
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3">Financeiro</th>
              <th className="p-3">Compras</th>
              <th className="p-3">Ações</th>
            </tr>
          </thead>

          <tbody>
            {clientes.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">
                  <div className="font-semibold">{c.razao_social}</div>
                  <div className="text-xs text-slate-500">{c.nome_fantasia}</div>
                </td>

                <td className="p-3 text-center">
                  <div>{c.contato_financeiro}</div>
                  <div className="text-xs">{c.telefone_financeiro}</div>
                  <div className="text-xs">{c.email_financeiro}</div>
                </td>

                <td className="p-3 text-center">
                  <div>{c.contato_compras}</div>
                  <div className="text-xs">{c.telefone_compras}</div>
                  <div className="text-xs">{c.email_compras}</div>
                </td>

                <td className="p-3 text-center">
                  <button
                    onClick={() => openEditar(c)}
                    className="erp-button-secondary text-xs"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {formOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl w-[600px] space-y-4">

            <h2 className="text-xl font-bold">
              {editing ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>

            <input
              placeholder="Razão Social"
              className="erp-input"
              value={form.razao_social}
              onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
            />

            <input
              placeholder="Nome Fantasia"
              className="erp-input"
              value={form.nome_fantasia}
              onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">

              {/* FINANCEIRO */}
              <div>
                <h3 className="font-semibold mb-2">Financeiro</h3>

                <input
                  placeholder="Contato"
                  className="erp-input"
                  value={form.contato_financeiro}
                  onChange={(e) =>
                    setForm({ ...form, contato_financeiro: e.target.value })
                  }
                />

                <input
                  placeholder="Telefone"
                  className="erp-input mt-2"
                  value={form.telefone_financeiro}
                  onChange={(e) =>
                    setForm({ ...form, telefone_financeiro: e.target.value })
                  }
                />

                <input
                  placeholder="Email"
                  className="erp-input mt-2"
                  value={form.email_financeiro}
                  onChange={(e) =>
                    setForm({ ...form, email_financeiro: e.target.value })
                  }
                />
              </div>

              {/* COMPRAS */}
              <div>
                <h3 className="font-semibold mb-2">Compras</h3>

                <input
                  placeholder="Contato"
                  className="erp-input"
                  value={form.contato_compras}
                  onChange={(e) =>
                    setForm({ ...form, contato_compras: e.target.value })
                  }
                />

                <input
                  placeholder="Telefone"
                  className="erp-input mt-2"
                  value={form.telefone_compras}
                  onChange={(e) =>
                    setForm({ ...form, telefone_compras: e.target.value })
                  }
                />

                <input
                  placeholder="Email"
                  className="erp-input mt-2"
                  value={form.email_compras}
                  onChange={(e) =>
                    setForm({ ...form, email_compras: e.target.value })
                  }
                />
              </div>

            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFormOpen(false)}
                className="erp-button-secondary w-full"
              >
                Cancelar
              </button>

              <button
                onClick={salvar}
                className="erp-button-primary w-full"
              >
                <Save className="h-4 w-4" />
                Salvar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
