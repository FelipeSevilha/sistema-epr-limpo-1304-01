'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, ClipboardList, Package, RefreshCw } from 'lucide-react';

type ItemFicha = {
  id: string;
  produto_nome: string;
  material_nome: string;
  quantidade: number;
  unidade: string;
  created_at?: string;
};

export default function FichaTecnicaPage() {
  const [lista, setLista] = useState<ItemFicha[]>([]);
  const [produto, setProduto] = useState('');
  const [material, setMaterial] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [unidade, setUnidade] = useState('un');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function fetchData() {
    try {
      setLoading(true);
      setErrorMsg('');

      const { data, error } = await supabase
        .from('ficha_tecnica')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLista((data as ItemFicha[]) || []);
    } catch (err: any) {
      console.error('Erro ao carregar ficha técnica:', err);
      setErrorMsg(err?.message || 'Erro ao carregar ficha técnica.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleAdd() {
    try {
      setErrorMsg('');
      setSuccessMsg('');

      const produtoTrim = produto.trim();
      const materialTrim = material.trim();
      const unidadeTrim = unidade.trim() || 'un';
      const qtd = Number(quantidade);

      if (!produtoTrim) {
        setErrorMsg('Informe o nome do produto.');
        return;
      }

      if (!materialTrim) {
        setErrorMsg('Informe o nome do material.');
        return;
      }

      if (!qtd || qtd <= 0) {
        setErrorMsg('Informe uma quantidade maior que zero.');
        return;
      }

      setSaving(true);

      const { error } = await supabase.from('ficha_tecnica').insert({
        produto_nome: produtoTrim,
        material_nome: materialTrim,
        quantidade: qtd,
        unidade: unidadeTrim,
      });

      if (error) throw error;

      setMaterial('');
      setQuantidade('');
      setUnidade('un');
      setSuccessMsg('Item adicionado com sucesso.');
      await fetchData();
    } catch (err: any) {
      console.error('Erro ao adicionar item na ficha técnica:', err);
      setErrorMsg(err?.message || 'Erro ao adicionar item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setErrorMsg('');
      setSuccessMsg('');

      const confirmar = window.confirm('Deseja realmente excluir este item da ficha técnica?');
      if (!confirmar) return;

      const { error } = await supabase.from('ficha_tecnica').delete().eq('id', id);

      if (error) throw error;

      setSuccessMsg('Item removido com sucesso.');
      await fetchData();
    } catch (err: any) {
      console.error('Erro ao excluir item:', err);
      setErrorMsg(err?.message || 'Erro ao excluir item.');
    }
  }

  const agrupado = useMemo(() => {
    const mapa: Record<string, ItemFicha[]> = {};

    for (const item of lista) {
      const chave = item.produto_nome || 'Sem produto';
      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(item);
    }

    return mapa;
  }, [lista]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ficha Técnica</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Cadastre os materiais que compõem cada produto.
        </p>
      </div>

      <section className="erp-card p-5">
        <div className="grid gap-3">
          <input
            placeholder="Produto (ex: Caderno 96 folhas)"
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            className="erp-input w-full"
          />

          <div className="grid gap-3 md:grid-cols-4">
            <input
              placeholder="Material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="erp-input"
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Qtd"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="erp-input"
            />

            <input
              placeholder="Unidade"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
              className="erp-input"
            />

            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className={`erp-button-primary h-11 ${
                saving ? 'cursor-not-allowed opacity-70' : ''
              }`}
            >
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {(errorMsg || successMsg) && (
          <div className="mt-4 space-y-2">
            {errorMsg && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                {successMsg}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="erp-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-sky-500" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Itens cadastrados
          </h2>
        </div>

        {loading ? (
          <div className="flex h-28 items-center justify-center">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          </div>
        ) : lista.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Nenhum item de ficha técnica cadastrado ainda.
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(agrupado).map(([produtoNome, itens]) => (
              <div
                key={produtoNome}
                className="rounded-3xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4 text-violet-500" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {produtoNome}
                  </h3>
                </div>

                <div className="space-y-2">
                  {itens.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="text-sm text-slate-700 dark:text-slate-200">
                        <span className="font-semibold">{item.material_nome}</span>{' '}
                        — {item.quantidade} {item.unidade}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-600"
                      >
                        <Trash2 className="mr-1.5 h-4 w-4" />
                        Excluir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
