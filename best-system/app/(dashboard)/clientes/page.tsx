'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Search } from 'lucide-react';

export default function ClientesPage() {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<any>({
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
    telefone_comercial: '',
    email_comercial: '',

    contato_financeiro: '',
    telefone_financeiro: '',
    email_financeiro: '',

    observacoes: '',
  });

  /* =========================
     BUSCAR CEP (ViaCEP)
  ========================= */

  async function buscarCEP() {
    const cep = form.cep.replace(/\D/g, '');
    if (cep.length < 8) return;

    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const data = await res.json();

    if (!data.erro) {
      setForm({
        ...form,
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      });
    }
  }

  /* =========================
     SALVAR
  ========================= */

  async function salvar() {
    await supabase.from('clientes').insert({
      ...form,
      created_at: new Date().toISOString(),
    });

    alert('Cliente cadastrado!');
    setOpen(false);
    location.reload();
  }

  return (
    <div className="p-6">

      {/* BOTÃO */}
      <button
        onClick={() => setOpen(true)}
        className="erp-button-primary"
      >
        Novo Cliente
      </button>

      {/* SIDEBAR */}
      {open && (
        <div className="fixed inset-0 z-50 flex">

          <div
            className="flex-1 bg-black/40"
            onClick={() => setOpen(false)}
          />

          <div className="w-[520px] bg-white dark:bg-slate-900 h-full overflow-auto shadow-2xl">

            {/* HEADER */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-xl font-bold">Novo Cliente</h2>
                <p className="text-sm text-slate-500">
                  Preencha os dados cadastrais
                </p>
              </div>

              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>

            <div className="p-6 space-y-6">

              {/* DADOS */}
              <div>
                <h3 className="font-semibold mb-3">Dados da Empresa</h3>

                <input
                  placeholder="Razão Social"
                  className="erp-input mb-2"
                  onChange={(e) =>
                    setForm({ ...form, razao_social: e.target.value })
                  }
                />

                <input
                  placeholder="Nome Fantasia"
                  className="erp-input mb-2"
                  onChange={(e) =>
                    setForm({ ...form, nome_fantasia: e.target.value })
                  }
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="CNPJ"
                    className="erp-input"
                    onChange={(e) =>
                      setForm({ ...form, cnpj: e.target.value })
                    }
                  />

                  <input
                    placeholder="Inscrição Estadual"
                    className="erp-input"
                    onChange={(e) =>
                      setForm({ ...form, ie: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <select
                    className="erp-input"
                    onChange={(e) =>
                      setForm({ ...form, setor: e.target.value })
                    }
                  >
                    <option>Selecione...</option>
                    <option>Compras</option>
                    <option>Financeiro</option>
                    <option>Proprietário</option>
                  </select>

                  <div className="flex items-center gap-2">
                    <span>Status</span>
                    <input
                      type="checkbox"
                      checked={form.status}
                      onChange={() =>
                        setForm({ ...form, status: !form.status })
                      }
                    />
                    <span className="text-green-500">Ativo</span>
                  </div>
                </div>
              </div>

              {/* ENDEREÇO */}
              <div>
                <h3 className="font-semibold mb-3">Endereço</h3>

                <div className="flex gap-2">
                  <input
                    placeholder="CEP"
                    className="erp-input w-full"
                    onChange={(e) =>
                      setForm({ ...form, cep: e.target.value })
                    }
                  />

                  <button
                    onClick={buscarCEP}
                    className="erp-button-primary"
                  >
                    Buscar CEP
                  </button>
                </div>

                <input
                  placeholder="Endereço"
                  className="erp-input mt-2"
                  value={form.endereco}
                />

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    placeholder="Número"
                    className="erp-input"
                    onChange={(e) =>
                      setForm({ ...form, numero: e.target.value })
                    }
                  />

                  <input
                    placeholder="Bairro"
                    className="erp-input"
                    value={form.bairro}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    placeholder="Cidade"
                    className="erp-input"
                    value={form.cidade}
                  />

                  <input
                    placeholder="Estado"
                    className="erp-input"
                    value={form.estado}
                  />
                </div>
              </div>

              {/* CONTATO COMERCIAL */}
              <div>
                <h3 className="font-semibold mb-3">Contato Comercial</h3>

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

              {/* CONTATO FINANCEIRO */}
              <div>
                <h3 className="font-semibold mb-3">Contato Financeiro</h3>

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

              {/* OBS */}
              <div>
                <h3 className="font-semibold mb-3">Observações</h3>

                <textarea
                  className="erp-input h-24"
                  placeholder="Informações adicionais..."
                  onChange={(e) =>
                    setForm({ ...form, observacoes: e.target.value })
                  }
                />
              </div>

            </div>

            {/* FOOTER */}
            <div className="flex justify-between p-6 border-t">
              <button
                onClick={() => setOpen(false)}
                className="erp-button-secondary"
              >
                Cancelar
              </button>

              <button
                onClick={salvar}
                className="erp-button-primary"
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
