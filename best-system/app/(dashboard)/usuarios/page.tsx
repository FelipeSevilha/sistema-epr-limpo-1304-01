'use client';

import { useMemo, useState } from 'react';
import {
  UserCog,
  Search,
  ShieldCheck,
  Users,
  UserPlus,
  CircleCheck,
  Eye,
  Pencil,
} from 'lucide-react';

type UsuarioItem = {
  id: string;
  nome: string;
  email: string;
  perfil: 'Administrador' | 'Vendedor' | 'Financeiro' | 'Produção';
  status: 'Ativo' | 'Inativo';
  ultimoAcesso: string;
};

const usuariosBase: UsuarioItem[] = [
  {
    id: '1',
    nome: 'Felipe Sevilha',
    email: 'felipe@dsevilha.com.br',
    perfil: 'Administrador',
    status: 'Ativo',
    ultimoAcesso: 'Hoje às 09:42',
  },
  {
    id: '2',
    nome: 'Wanessa Castro',
    email: 'wanessa@dsevilha.com.br',
    perfil: 'Vendedor',
    status: 'Ativo',
    ultimoAcesso: 'Hoje às 08:10',
  },
  {
    id: '3',
    nome: 'Financeiro',
    email: 'financeiro@dsevilha.com.br',
    perfil: 'Financeiro',
    status: 'Ativo',
    ultimoAcesso: 'Ontem às 17:20',
  },
  {
    id: '4',
    nome: 'Produção',
    email: 'producao@dsevilha.com.br',
    perfil: 'Produção',
    status: 'Inativo',
    ultimoAcesso: 'Há 3 dias',
  },
];

export default function UsuariosPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<UsuarioItem | null>(null);

  const filtered = useMemo(() => {
    return usuariosBase.filter((user) => {
      return (
        user.nome.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.perfil.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [search]);

  const ativos = usuariosBase.filter((u) => u.status === 'Ativo').length;
  const admins = usuariosBase.filter((u) => u.perfil === 'Administrador').length;

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Usuários
            </p>
            <Users className="h-4 w-4 text-sky-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{usuariosBase.length}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Ativos
            </p>
            <CircleCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{ativos}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Administradores
            </p>
            <ShieldCheck className="h-4 w-4 text-violet-500" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{admins}</p>
        </div>

        <div className="erp-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Novo acesso
            </p>
            <UserPlus className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white">Controle por perfil</p>
        </div>
      </section>

      <section className="erp-card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200/70 px-5 py-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar usuário..."
              className="erp-input w-80 pl-10"
            />
          </div>

          <button
            type="button"
            className="erp-button-primary"
            onClick={() => alert('Na próxima etapa eu adiciono o formulário premium de usuário.')}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Novo usuário
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60">
                {['Usuário', 'E-mail', 'Perfil', 'Status', 'Último acesso', 'Ações'].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold text-white">
                        {user.nome
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>

                      <span className="font-medium text-slate-900 dark:text-white">{user.nome}</span>
                    </div>
                  </td>

                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{user.email}</td>

                  <td className="px-5 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {user.perfil}
                    </span>
                  </td>

                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.status === 'Ativo'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="px-5 py-3 text-slate-600 dark:text-slate-300">{user.ultimoAcesso}</td>

                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelected(user)}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                        title="Ver"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => alert('Na próxima etapa eu adiciono a edição premium de usuário.')}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-sky-400"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => alert('Na próxima etapa eu adiciono permissões reais por perfil.')}
                        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-violet-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-violet-400"
                        title="Permissões"
                      >
                        <UserCog className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                  Usuário
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {selected.nome}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {selected.email}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="erp-button-secondary px-3 py-2 text-xs"
              >
                Fechar
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Perfil
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {selected.perfil}
                </p>
              </div>

              <div className="erp-card p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Status
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
                  {selected.status}
                </p>
              </div>
            </div>

            <div className="mt-4 erp-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Último acesso
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                {selected.ultimoAcesso}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
