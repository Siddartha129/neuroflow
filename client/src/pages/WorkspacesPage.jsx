import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';

export function WorkspacesPage() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState } = useForm();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.workspaces,
    queryFn: async () => (await api.get('/workspaces')).data
  });

  const createMutation = useMutation({
    mutationFn: async (values) => (await api.post('/workspaces', values)).data,
    onSuccess: () => {
      reset();
      queryClient.invalidateQueries({ queryKey: queryKeys.workspaces });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => api.delete(`/workspaces/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.workspaces })
  });

  const workspaces = data?.workspaces || [];

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="rounded-lg border border-line bg-white p-5">
        <h1 className="text-xl font-semibold">Create workspace</h1>
        <p className="mt-1 text-sm text-muted">Group documents, chats, and workflow runs by project.</p>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit((values) => createMutation.mutate(values))}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Name</span>
            <input
              className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
              {...register('name', { required: true })}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Description</span>
            <textarea
              className="focus-ring mt-1 min-h-24 w-full rounded-md border border-line px-3 py-2"
              {...register('description')}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Color</span>
            <input
              className="focus-ring mt-1 h-10 w-full rounded-md border border-line px-2"
              type="color"
              defaultValue="#2563eb"
              {...register('color')}
            />
          </label>
          <button
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 font-medium text-white hover:bg-cyan-800 disabled:opacity-60"
            disabled={formState.isSubmitting || createMutation.isPending}
            type="submit"
          >
            <Plus size={16} />
            Create
          </button>
        </form>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="text-xl font-semibold">Workspaces</h2>
        <div className="mt-4 divide-y divide-line">
          {isLoading ? <p className="py-8 text-center text-sm text-muted">Loading workspaces...</p> : null}
          {!isLoading && !workspaces.length ? (
            <p className="py-8 text-center text-sm text-muted">No workspaces yet.</p>
          ) : null}
          {workspaces.map((workspace) => (
            <div className="flex items-center justify-between gap-4 py-4" key={workspace.id}>
              <Link className="min-w-0 flex-1" to={`/workspaces/${workspace.id}`}>
                <div className="flex items-center gap-3">
                  <span
                    className="h-4 w-4 rounded"
                    style={{ backgroundColor: workspace.color || '#2563eb' }}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{workspace.name}</p>
                    <p className="truncate text-sm text-muted">{workspace.description || 'No description'}</p>
                  </div>
                </div>
              </Link>
              <button
                className="focus-ring grid h-9 w-9 place-items-center rounded-md border border-line text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => deleteMutation.mutate(workspace.id)}
                title="Delete workspace"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
