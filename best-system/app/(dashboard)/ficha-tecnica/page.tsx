'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, ClipboardList } from 'lucide-react';

type ItemFicha = {
  id: string;
  produto_nome: string;
  material_nome: string;
  quantidade: number;
  unidade: string;
};

export default function FichaTecnicaPage() {
  const [lista, setLista] = useState<ItemFicha[]>([]);
  const [produto, setProduto] = useState('');
  const [material, setMaterial] = useState('');
  const [quantidade, setQuantidade] = useState(0);
  const [unidade, setUnidade] = useState('un');

  async function fetchData() {
    const { data } = await supabase.from('ficha_tecnica').select('*');
    if (data) setLista(data as ItemFicha[]);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleAdd() {
    if (!produto || !material || quantidade <= 0) {
      alert('Preencha tudo corretamente');
      return;
    }

    await supabase.from('ficha_tecnica').insert({
      produto_nome: produto,
      material_nome: material,
      quantidade,
      unidade,
    });

    setMaterial('');
    setQuantidade(0);
    fetchData();
  }

  async function handleDelete(id: string) {
    await supabase.from('ficha_tecnica').delete().eq('id', id);
    fetchData();
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Ficha Técnica</h2>

      <div className="erp-card p-4 space-y-3">
        <input
          placeholder="Produto (ex: Caderno 96 folhas)"
          value={produto}
          onChange={(e) => setProduto(e.target.value)}
          className="erp-input w-full"
        />

        <div className="grid grid-cols-4 gap-2">
          <input
            placeholder="Material"
            value={material}
            onChange={(e) => setMaterial(e.target.value)}
            className="erp-input"
          />

          <input
            type="number"
            placeholder="Qtd"
            value={quantidade}
            onChange={(e) => setQuantidade(Number(e.target.value))}
            className="erp-input"
          />

          <input
            placeholder="Unidade"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            className="erp-input"
          />

          <button onClick={handleAdd} className="erp-button-primary">
            <Plus />
          </button>
        </div>
      </div>

      <div className="erp-card p-4">
        {lista.map((item) => (
          <div key={item.id} className="flex justify-between py-2 border-b">
            <span>
              <b>{item.produto_nome}</b> → {item.material_nome} ({item.quantidade}{' '}
              {item.unidade})
            </span>

            <button onClick={() => handleDelete(item.id)}>
              <Trash2 />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
