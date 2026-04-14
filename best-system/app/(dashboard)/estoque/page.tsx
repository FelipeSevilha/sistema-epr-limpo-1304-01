'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Package,
  Pencil,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Boxes,
  ShieldAlert,
  CircleDollarSign,
  Factory,
  ShoppingCart,
} from 'lucide-react';
import { supabase, EstoqueItem as EstoqueItemDB } from '@/lib/supabase';
import EstoqueItemForm, { EstoqueItem } from '@/components/estoque/EstoqueItemForm';

type StatusEstoque = 'Normal' | 'Baixo' | 'Crítico';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function calcStatus(quantidade: number, estoqueMinimo: number): StatusEstoque {
  if (quantidade === 0) return 'Crítico';
  if (quantidade < estoqueMinimo * 0.5) return 'Crítico';
  if (quantidade < estoqueMinimo) return 'Baixo';
  return 'Normal';
}

const statusConfig: Record<StatusEstoque, string> = {
  Normal: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  Baixo: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  Crítico: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300',
};

function adaptFromDB(item: EstoqueItemDB) {
  return {
    id: item.id,
    item: item.item,
    categoria: item.categoria,
    quantidade: item.quantidade,
    unidade: item.unidade,
    estoqueMinimo: item.estoque_minimo,
    fornecedor: item.fornecedor,
    valorUnit: item.valor_unitario,
    status: calcStatus(item.quantidade, item.estoque_minimo),
  };
}

function isRelacionadoProducao(categoria: string, item: string) {
  const texto = `${categoria} ${item}`.toLowerCase();

  return (
    texto.includes('papel') ||
    texto.includes('wire') ||
    texto.includes('adesivo') ||
    texto.includes('bopp') ||
    texto.includes('capa') ||
    texto.includes('miolo') ||
    texto.includes('impress') ||
    texto.includes('toner') ||
    texto.includes('espiral') ||
    texto.includes('verniz') ||
    texto.includes('lamin')
  );
}

export default function EstoquePage() {
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('Todas');
  const [lista, setLista] = useState<(EstoqueItem & { status: StatusEstoque })[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<(EstoqueItem & { status: StatusEstoque }) | null>(null);
  const [qtyItem, setQtyItem] = useState<(EstoqueItem & { status: StatusEstoque }) | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchEstoque = useCallback(async () => {
    const { data } = await supabase.from('estoque').select('*').order('item');
    if (data) setLista(data.map(adaptFromDB));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEstoque();

    const channel = supabase
      .channel('estoque_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque' }, fetchEstoque)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchEstoque]);

  const categorias = ['Todas', ...Array.from(new Set(lista.map((p) => p.categoria)))];

  const filtered = useMemo(() => {
    return lista.filter((e) => {
      const matchSearch =
        e.item.toLowerCase().includes(search.toLowerCase()) ||
        e.fornecedor.toLowerCase().includes(search.toLowerCase());

      const matchCat = filterCategoria === 'Todas' || e.categoria === filterCategoria;
      return matchSearch && matchCat;
    });
  }, [lista, search, filterCategoria]);

  const totalItens = lista.length;
  const criticos = lista.filter((i) => i.status === 'Crítico').length;
  const baixos = lista.filter((i) => i.status === 'Baixo').length;
  const valorTotal = lista.reduce((sum, i) => sum + i.quantidade * i.valorUnit, 0);
  const criticosProducao = lista.filter(
    (i) => i.status === 'Crítico' && isRelacionadoProducao(i.categoria, i.item)
  ).length;
  const baixosCompra = lista.filter(
    (i) => (i.status === 'Crítico' || i.status === 'Baixo') && isRelacionadoProducao(i.categoria, i.item)
  ).length;

  const handleSave = async (data: Omit<EstoqueItem, 'id' | 'status'>) => {
    const payload = {
      item: data.item,
      categoria: data.categoria,
      quantidade: data.quantidade,
      unidade: data.unidade,
      estoque_minimo: data.estoqueMinimo,
      fornecedor: data.fornecedor,
      valor_unitario: data.valorUnit,
      updated_at: new Date().toISOString(),
    };

    if (editingItem) {
      await supabase.from('estoque').update(payload).eq('id', editingItem.id);
    } else {
      await supabase.from('estoque').insert(payload);
    }

    setFormOpen(false);
    setEditingItem(null);
  };

  const handleQtySave = async (data: Omit<EstoqueItem, 'id' | 'status'>) => {
    if (!qtyItem) return;

    await supabase
      .from('estoque')
      .update({
        quantidade: data.quantidade,
        updated_at: new Date().toISOString(),
      })
      .eq('id', qtyItem.id);

    setQtyItem(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('estoque').delete().eq('id', id);
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-6">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Itens cadastrados
            </p>
            <Boxes className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalItens}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Estoque baixo
            </p>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{baixos}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Críticos
            </p>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{criticos}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Críticos p/ produção
            </p>
            <Factory className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{criticosProducao}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Itens para compra
            </p>
            <ShoppingCart className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{baixosCompra}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Valor estimado
            </p>
            <CircleDollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{fmt(valorTotal)}</p>
        </div>
      </section>

      {criticosProducao > 0 && (
        <section className="rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-500/20 dark:bg-red-500/10">
          <div className="flex items-start gap-3">
            <Factory className="mt-0.5 h-5 w-5 text-red-500" />
            <div>
              <h3 className="text-sm font-bold text-red-700 dark:text-red-300">
                Atenção: existem itens críticos ligados à produção
              </h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Alguns materiais importantes para fabricação estão em nível crítico e já impactam compras.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar item ou fornecedor..."
                className="erp-input w-72 pl-10"
              />
            </div>

            <select
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value)}
              className="erp-input w-44"
            >
              {categorias.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setEditingItem(null);
              setFormOpen(true);
            }}
            className="erp-button-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60">
                {[
                  'Item',
                  'Categoria',
                  'Quantidade',
                  'Unidade',
                  'Mínimo',
                  'Fornecedor',
                  'Valor Unit.',
                  'Valor Total',
                  'Status',
                  'Produção',
                  'Compra',
                  'Ações',
                ].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((e) => {
                const ligadoProducao = isRelacionadoProducao(e.categoria, e.item);
                const precisaCompra = e.status === 'Crítico' || e.status === 'Baixo';

                return (
                  <tr
                    key={e.id}
                    className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 ${
                      e.status === 'Crítico' ? 'bg-red-50/40 dark:bg-red-500/5' : ''
                    }`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-2xl ${
                            e.status === 'Crítico'
                              ? 'bg-red-100 dark:bg-red-500/10'
                              : e.status === 'Baixo'
                              ? 'bg-amber-100 dark:bg-amber-500/10'
                              : 'bg-slate-100 dark:bg-slate-800'
                          }`}
                        >
                          <Package
                            className={`h-4 w-4 ${
                              e.status === 'Crítico'
                                ? 'text-red-500'
                                : e.status === 'Baixo'
                                ? 'text-amber-500'
                                : 'text-slate-500'
                            }`}
                          />
                        </div>

                        <span className="font-medium text-slate-800 dark:text-slate-100">{e.item}</span>
                      </div>
                    </td>

                    <td className="px-5 py-3">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {e.categoria}
                      </span>
                    </td>

                    <td className={`px-5 py-3 font-bold ${
                      e.status === 'Crítico'
                        ? 'text-red-600 dark:text-red-400'
                        : e.status === 'Baixo'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-900 dark:text-white'
                    }`}>
                      {e.quantidade.toLocaleString('pt-BR')}
                    </td>

                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.unidade}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.estoqueMinimo}</td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{e.fornecedor || '—'}</td>
                    <td className="px-5 py-3 text-slate-700 dark:text-slate-200">{fmt(e.valorUnit)}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{fmt(e.quantidade * e.valorUnit)}</td>

                    <td className="px-5 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusConfig[e.status]}`}>
                        {e.status}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      {ligadoProducao ? (
                        <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                          Ligado
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Geral
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3">
                      {precisaCompra ? (
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          e.status === 'Crítico'
                            ? 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300'
                        }`}>
                          Sugerida
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                          Ok
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQtyItem(e)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400"
                          title="Atualizar quantidade"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingItem(e);
                            setFormOpen(true);
                          }}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-sky-50 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-sky-500/10 dark:hover:text-sky-400"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirm(e.id)}
                          className="rounded-xl p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nenhum item de estoque encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <EstoqueItemForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
        item={editingItem}
      />

      <EstoqueItemForm
        open={!!qtyItem}
        onClose={() => setQtyItem(null)}
        onSave={handleQtySave}
        item={qtyItem}
        mode="qty"
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir item</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Essa ação remove o item do estoque. Deseja continuar?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="erp-button-secondary">
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="inline-flex items-center justify-center rounded-2xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
