import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';
import { StatusPill } from '../components/StatusPill.jsx';

export function RunDetailsPage() {
  const { runId } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.run(runId),
    queryFn: async () => (await api.get(`/runs/${runId}`)).data
  });

  if (isLoading) return <p className="text-sm text-muted">Loading run...</p>;

  const run = data?.run;
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">{run?.title}</h1>
            <p className="mt-1 text-sm text-muted">{run?.type}</p>
          </div>
          <StatusPill status={run?.status} />
        </div>
      </section>

      <JsonPanel title="Input" value={run?.input} />
      <JsonPanel title="Output" value={run?.output} />
      <JsonPanel title="Evaluation" value={run?.evaluation} />

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="font-semibold">Citations</h2>
        <div className="mt-3 space-y-3">
          {(run?.citations || []).map((citation) => (
            <div className="rounded-md border border-line p-3 text-sm" key={citation.chunkId}>
              <p className="font-medium">{citation.documentName}</p>
              <p className="mt-1 text-muted">{citation.snippet}</p>
            </div>
          ))}
          {!run?.citations?.length ? <p className="text-sm text-muted">No citations were captured.</p> : null}
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <h2 className="font-semibold">Execution trace</h2>
        <div className="mt-3 divide-y divide-line">
          {(run?.trace || []).map((item, index) => (
            <div className="py-3 text-sm" key={`${item.stage}-${index}`}>
              <p className="font-medium">{item.stage}</p>
              <pre className="mt-1 overflow-auto whitespace-pre-wrap text-xs text-muted">{JSON.stringify(item.detail, null, 2)}</pre>
            </div>
          ))}
        </div>
      </section>

      {run?.workspaceId ? (
        <Link className="text-sm font-medium text-cyan-700" to={`/workspaces/${run.workspaceId}`}>
          Back to workspace
        </Link>
      ) : null}
    </div>
  );
}

function JsonPanel({ title, value }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="font-semibold">{title}</h2>
      <pre className="mt-3 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
        {JSON.stringify(value || {}, null, 2)}
      </pre>
    </section>
  );
}
