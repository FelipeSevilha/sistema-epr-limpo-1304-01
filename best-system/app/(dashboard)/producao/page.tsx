'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ProducaoPage() {
  const [ordens, setOrdens] = useState<any[]>([]);
  const [observacao, setObservacao] = useState('');
  const [operador, setOperador] = useState('');
  const [arquivo, setArquivo] = useState('');

  async function carregar() {
    const { data } = await supabase.from('ordens_producao').select('*');
    setOrdens(data || []);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function salvarApontamento(ordemId: string) {
    await supabase.from('apontamentos_producao').insert({
      ordem_id: ordemId,
      operador_nome: operador,
      observacao: observacao,
      etapa: 'Manual',
    });

    alert('Apontamento salvo!');
    setObservacao('');
    setOperador('');
  }

  async function adicionarChecklist(ordemId: string) {
    const item = prompt('Nome do item do checklist:');
    if (!item) return;

    await supabase.from('checklist_producao').insert({
      ordem_id: ordemId,
      etapa: 'Produção',
      item,
    });

    alert('Checklist adicionado!');
  }

  async function adicionarArquivo(ordemId: string) {
    if (!arquivo) return;

    await supabase.from('arquivos_producao').insert({
      ordem_id: ordemId,
      nome: 'Arte cliente',
      url: arquivo,
    });

    alert('Arquivo vinculado!');
    setArquivo('');
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Produção Avançada</h1>

      {ordens.map((ordem) => (
        <div key={ordem.id} className="border p-4 rounded-xl space-y-4 bg-white dark:bg-slate-900">

          <div>
            <h2 className="font-bold">{ordem.produto_nome}</h2>
            <p className="text-sm text-gray-500">{ordem.cliente_nome}</p>
          </div>

          {/* OPERADOR */}
          <div>
            <input
              placeholder="Nome do operador"
              value={operador}
              onChange={(e) => setOperador(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          {/* OBSERVAÇÃO */}
          <div>
            <textarea
              placeholder="Observação interna"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="border p-2 rounded w-full"
            />
          </div>

          <button
            onClick={() => salvarApontamento(ordem.id)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Salvar Apontamento
          </button>

          {/* CHECKLIST */}
          <button
            onClick={() => adicionarChecklist(ordem.id)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Adicionar Checklist
          </button>

          {/* ARQUIVO */}
          <div className="flex gap-2">
            <input
              placeholder="Link da arte (Drive, PDF, etc)"
              value={arquivo}
              onChange={(e) => setArquivo(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <button
              onClick={() => adicionarArquivo(ordem.id)}
              className="bg-purple-600 text-white px-4 rounded"
            >
              Vincular
            </button>
          </div>

        </div>
      ))}
    </div>
  );
}
