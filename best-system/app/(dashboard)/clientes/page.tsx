'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X } from 'lucide-react';

export default function ClientesPage() {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState<any>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    ie: '',

    cep: '',
    endereco: '',
    numero: '',
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
     FORMATADORES
  ========================= */

  function formatCNPJ(value: string) {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  }

  function formatPhone(value: string) {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .slice(0, 15);
  }

  function formatCEP(value: string) {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .slice(0, 9);
  }

  /* =========================
     BUSCAR CEP
  ========================= */

  async function buscarCEP() {
    if (form.cep.length < 8) return;

    const cep = form.cep.replace(/\D/g, '');

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();

      if (data.erro) {
        alert('CEP não encontrado');
        return;
      }

      setForm((prev: any) => ({
        ...prev,
        endereco: data.logradouro,
        bairro: data.bairro,
        cidade: data.localidade,
        estado: data.uf,
      }));
    } catch {
      alert('Erro ao buscar CEP');
    }
  }

  /* =========================
     VALIDAÇÃO
  ========================= */

  function validar() {
    if (!form.razao_social) {
      alert('Razão social obrigatória');
      return false;
    }

    if (form.cnpj.length < 18) {
      alert('CNPJ inválido');
      return false;
    }

    if (form.telefone_comercial.length < 14) {
      alert('Telefone comercial inválido');
      return false;
    }

    return true;
  }

  /* =========================
     SALVAR
  ========================= */

  async function salvar() {
    if (!validar()) return;

    try {
      const { error } = await supabase.from('clientes').insert({
        ...form,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      alert('Cliente cadastrado!');
      setOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="p-6">

      <button onClick={() => setOpen(true)} className="erp-button-primary">
        Novo Cliente
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-start py-10 z-50">

          <div className="bg-white dark:bg-slate-900 w-[800px] rounded-3xl shadow-xl">

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
                <h3 className="font-semibold mb-3">Dados da Empresa</h3>

                <input
                  placeholder="Razão Social"
                  className="erp-input mb-2"
                  value={form.razao_social}
                  onChange={(e) =>
                    setForm({ ...form, razao_social: e.target.value })
                  }
                />

                <input
                  placeholder="Nome Fantasia"
                  className="erp-input mb-2"
                  value={form.nome_fantasia}
                  onChange={(e) =>
                    setForm({ ...form, nome_fantasia: e.target.value })
                  }
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="CNPJ"
                    className="erp-input"
                    value={form.cnpj}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cnpj: formatCNPJ(e.target.value),
                      })
                    }
                  />

                  <input
                    placeholder="IE"
                    className="erp-input"
                    value={form.ie}
                    onChange={(e) =>
                      setForm({ ...form, ie: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* ENDEREÇO */}
              <div>
                <h3 className="font-semibold mb-3">Endereço</h3>

                <div className="flex gap-2">
                  <input
                    placeholder="CEP"
                    className="erp-input w-full"
                    value={form.cep}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cep: formatCEP(e.target.value),
                      })
                    }
                  />

                  <button
                    onClick={buscarCEP}
                    className="erp-button-primary"
                  >
                    Buscar
                  </button>
                </div>

                <input
                  placeholder="Endereço"
                  className="erp-input mt-2"
                  value={form.endereco}
                  onChange={(e) =>
                    setForm({ ...form, endereco: e.target.value })
                  }
                />

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    placeholder="Número"
                    className="erp-input"
                    value={form.numero}
                    onChange={(e) =>
                      setForm({ ...form, numero: e.target.value })
                    }
                  />

                  <input
                    placeholder="Bairro"
                    className="erp-input"
                    value={form.bairro}
                    onChange={(e) =>
                      setForm({ ...form, bairro: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input
                    placeholder="Cidade"
                    className="erp-input"
                    value={form.cidade}
                    onChange={(e) =>
                      setForm({ ...form, cidade: e.target.value })
                    }
                  />

                  <input
                    placeholder="Estado"
                    className="erp-input"
                    value={form.estado}
                    onChange={(e) =>
                      setForm({ ...form, estado: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* CONTATO COMERCIAL */}
              <div>
                <h3 className="font-semibold mb-3">Contato Comercial</h3>

                <input
                  placeholder="Nome"
                  className="erp-input mb-2"
                  value={form.contato_comercial}
                  onChange={(e) =>
                    setForm({ ...form, contato_comercial: e.target.value })
                  }
                />

                <input
                  placeholder="Telefone"
                  className="erp-input"
                  value={form.telefone_comercial}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      telefone_comercial: formatPhone(e.target.value),
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
                  value={form.contato_financeiro}
                  onChange={(e) =>
                    setForm({ ...form, contato_financeiro: e.target.value })
                  }
                />

                <input
                  placeholder="Telefone"
                  className="erp-input"
                  value={form.telefone_financeiro}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      telefone_financeiro: formatPhone(e.target.value),
                    })
                  }
                />
              </div>

            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-2 p-6 border-t">
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
