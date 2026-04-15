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
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Cliente = {
  id: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  contato?: string | null;
  telefone?: string | null;
  email?: string | null;
  cidade?: string | null;
  uf?: string | null;
  ativo?: boolean | null;
};

type Pedido = {
  id: string;
  cliente_nome?: string | null;
  valor?: number | null;
  status?: string | null;
};

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(v || 0);

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<any>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    cep: '',
    endereco: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: 'SP',

    contato_comercial: '',
    telefone_comercial: '',

    contato_financeiro: '',
    telefone_financeiro: '',
  });

  /* =========================
     LOAD
  ========================= */

  useEffect(() => {
    async function fetchData() {
      const [cliRes, pedRes] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('pedidos').select('*'),
      ]);

      setClientes(cliRes.data || []);
      setPedidos(pedRes.data || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  /* =========================
     BUSCA
  ========================= */

  const filtrados = useMemo(() => {
    return clientes.filter((c) =>
      (c.razao_social || '')
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [clientes, search]);

  /* =========================
     SALVAR
  ========================= */

  async function salvar() {
    await supabase.from('clientes').insert({
      ...form,
      created_at: new Date().toISOString(),
    });

    alert('Cliente criado!');
    setOpen(false);
    location.reload();
  }

  if (loading) return <div className="p-10">Carregando...</div>;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <input
          placeholder="Buscar cliente..."
          className="erp-input w-80"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => setOpen(true)}
          className="erp-button-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Novo Cliente
        </button>
      </div>

      {/* LISTA */}
      <div className="grid grid-cols-3 gap-4">
        {filtrados.map((c) => (
          <div key={c.id} className="erp-card p-4">
            <h3 className="font-bold">{c.razao_social}</h3>
            <p className="text-sm text-slate-500">{c.telefone}</p>
          </div>
        ))}
      </div>

      {/* SIDEBAR PREMIUM */}
      {open && (
        <div className="fixed inset-0 z-50 flex">

          {/* BACKDROP */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* SIDEBAR */}
          <div className="w-[500px] bg-white dark:bg-slate-900 h-full overflow-auto shadow-2xl">

            {/* HEADER */}
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">Novo Cliente</h2>
              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* DADOS */}
              <div>
                <h3 className="font-semibold mb-2">Dados</h3>

                <input
                  placeholder="Razão Social"
                  className="erp-input mb-2"
                  onChange={(e) =>
                    setForm({ ...form, razao_social: e.target.value })
                  }
                />

                <input
                  placeholder="Nome Fantasia"
                  className="erp-input"
                  onChange={(e) =>
                    setForm({ ...form, nome_fantasia: e.target.value })
                  }
                />
              </div>

              {/* ENDEREÇO */}
              <div>
                <h3 className="font-semibold mb-2">Endereço</h3>

                <input
                  placeholder="CEP"
                  className="erp-input mb-2"
                  onChange={(e) =>
                    setForm({ ...form, cep: e.target.value })
                  }
                />

                <input
                  placeholder="Endereço"
                  className="erp-input mb-2"
                  onChange={(e) =>
                    setForm({ ...form, endereco: e.target.value })
                  }
                />

                <input
                  placeholder="Cidade"
                  className="erp-input"
                  onChange={(e) =>
                    setForm({ ...form, cidade: e.target.value })
                  }
                />
              </div>

              {/* CONTATOS */}
              <div>
                <h3 className="font-semibold mb-2">Contato Comercial</h3>

                <input
                  placeholder="Nome"
                  className="erp-input mb-2"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contato_comercial: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Telefone"
                  className="erp-input"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      telefone_comercial: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <h3 className="font-semibold mb-2">Contato Financeiro</h3>

                <input
                  placeholder="Nome"
                  className="erp-input mb-2"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      contato_financeiro: e.target.value,
                    })
                  }
                />

                <input
                  placeholder="Telefone"
                  className="erp-input"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      telefone_financeiro: e.target.value,
                    })
                  }
                />
              </div>

              {/* BOTÃO */}
              <button
                onClick={salvar}
                className="erp-button-primary w-full"
              >
                Cadastrar Cliente
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
