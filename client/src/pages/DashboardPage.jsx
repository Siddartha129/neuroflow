import { useQuery } from '@tanstack/react-query';
import { FileText, History, PanelsTopLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';

export function DashboardPage() {
  const { data } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => (await api.get('/dashboard')).data
  });

  const stats = data?.stats || {};
  const workspaces = data?.workspaces || [];
  const recentRuns = data?.recentRuns || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Your document workspaces and recent intelligence activity.</p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric icon={PanelsTopLeft} label="Workspaces" value={stats.workspaceCount || 0} />
        <Metric icon={FileText} label="Documents" value={stats.documentCount || 0} />
        <Metric icon={History} label="Workflow runs" value={stats.runCount || 0} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Panel title="Recent workspaces" action={<LinkButton to="/workspaces">View all</LinkButton>}>
          <div className="divide-y divide-line">
            {workspaces.length ? (
              workspaces.map((workspace) => (
                <Link className="block py-3 hover:bg-slate-50" key={workspace.id} to={`/workspaces/${workspace.id}`}>
                  <p className="font-medium">{workspace.name}</p>
                  <p className="text-sm text-muted">{workspace.description || 'No description'}</p>
                </Link>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted">No workspaces yet.</p>
            )}
          </div>
        </Panel>
        <Panel title="Recent runs">
          <div className="divide-y divide-line">
            {recentRuns.length ? (
              recentRuns.map((run) => (
                <Link className="block py-3 hover:bg-slate-50" key={run.id} to={`/runs/${run.id}`}>
                  <p className="font-medium">{run.title}</p>
                  <p className="text-sm text-muted">{run.type} · {run.status}</p>
                </Link>
              ))
            ) : (
              <p className="py-8 text-center text-sm text-muted">No workflow runs yet.</p>
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <Icon className="text-cyan-700" size={18} />
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function LinkButton({ to, children }) {
  return (
    <Link className="focus-ring rounded-md bg-cyan-700 px-3 py-2 text-sm font-medium text-white" to={to}>
      {children}
    </Link>
  );
}
