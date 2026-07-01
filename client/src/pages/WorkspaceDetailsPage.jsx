import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileUp, MessageSquareText, Play, RefreshCw, Trash2, Workflow } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { queryKeys } from '../api/queryKeys.js';
import { StatusPill } from '../components/StatusPill.jsx';

const workflowStages = ['Planner', 'Retriever', 'Task', 'Writer', 'Evaluator'];

export function WorkspaceDetailsPage() {
  const { workspaceId } = useParams();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState('');
  const [prompt, setPrompt] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [threadId, setThreadId] = useState('');

  const workspaceQuery = useQuery({
    queryKey: queryKeys.workspace(workspaceId),
    queryFn: async () => (await api.get(`/workspaces/${workspaceId}`)).data
  });
  const documentsQuery = useQuery({
    queryKey: queryKeys.workspaceDocuments(workspaceId),
    queryFn: async () => (await api.get(`/workspaces/${workspaceId}/documents`)).data
  });
  const runsQuery = useQuery({
    queryKey: queryKeys.workspaceRuns(workspaceId),
    queryFn: async () => (await api.get(`/workspaces/${workspaceId}/runs`)).data
  });
  const threadsQuery = useQuery({
    queryKey: queryKeys.workspaceChat(workspaceId),
    queryFn: async () => (await api.get(`/workspaces/${workspaceId}/chat`)).data
  });
  const messagesQuery = useQuery({
    queryKey: [...queryKeys.workspaceChat(workspaceId), threadId, 'messages'],
    queryFn: async () => (await api.get(`/workspaces/${workspaceId}/chat/${threadId}/messages`)).data,
    enabled: Boolean(threadId)
  });

  const invalidateWorkspace = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.workspace(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workspaceDocuments(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workspaceRuns(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.workspaceChat(workspaceId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      body.append('file', file);
      return (await api.post(`/workspaces/${workspaceId}/documents/upload`, body)).data;
    },
    onSuccess: () => {
      setFile(null);
      invalidateWorkspace();
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id) => api.delete(`/documents/${id}`),
    onSuccess: invalidateWorkspace
  });

  const reprocessMutation = useMutation({
    mutationFn: async (id) => (await api.post(`/documents/${id}/reprocess`)).data,
    onSuccess: invalidateWorkspace
  });

  const workflowMutation = useMutation({
    mutationFn: async ({ path, body }) => (await api.post(`/workspaces/${workspaceId}/runs/${path}`, body)).data,
    onSuccess: invalidateWorkspace
  });

  const chatMutation = useMutation({
    mutationFn: async () => (await api.post(`/workspaces/${workspaceId}/chat`, { question, threadId })).data,
    onSuccess: (data) => {
      setQuestion('');
      setThreadId(data.threadId);
      invalidateWorkspace();
      queryClient.invalidateQueries({ queryKey: [...queryKeys.workspaceChat(workspaceId), data.threadId, 'messages'] });
    }
  });

  const workspace = workspaceQuery.data?.workspace;
  const stats = workspaceQuery.data?.stats || {};
  const documents = documentsQuery.data?.documents || [];
  const readyDocuments = documents.filter((document) => document.status === 'ready');
  const runs = runsQuery.data?.runs || [];
  const threads = threadsQuery.data?.threads || [];
  const messages = messagesQuery.data?.messages || [];
  const latestRun = runs[0];
  const activeThreadId = threadId || threads[0]?.id || '';

  useEffect(() => {
    if (!threadId && threads[0]?.id) setThreadId(threads[0].id);
  }, [threadId, threads]);

  if (workspaceQuery.isLoading) {
    return <p className="text-sm text-muted">Loading workspace...</p>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-5 w-5 rounded" style={{ backgroundColor: workspace?.color || '#2563eb' }} />
              <h1 className="text-2xl font-semibold tracking-normal">{workspace?.name}</h1>
            </div>
            <p className="mt-2 text-sm text-muted">{workspace?.description || 'No description'}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Docs" value={stats.documentCount || 0} />
            <Stat label="Ready" value={stats.readyDocumentCount || 0} />
            <Stat label="Runs" value={stats.runCount || 0} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Workflow size={18} className="text-cyan-700" />
          <h2 className="font-semibold">Workflow graph</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {workflowStages.map((stage, index) => {
            const active =
              index === 0 ||
              (index === 1 && stats.readyDocumentCount > 0) ||
              (index === 2 && stats.runCount > 0) ||
              (index === 3 && stats.completedRunWithOutputCount > 0) ||
              (index === 4 && stats.completedRunWithEvaluationCount > 0);
            return (
              <div
                className={`rounded-md border p-3 text-sm ${
                  active ? 'border-cyan-200 bg-cyan-50 text-cyan-900' : 'border-line bg-slate-50 text-muted'
                }`}
                key={stage}
              >
                <p className="font-medium">{stage}</p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
        <section className="space-y-6">
          <Panel icon={FileUp} title="Upload documents">
            <form
              className="flex flex-col gap-3 rounded-md border border-dashed border-line p-4 sm:flex-row sm:items-center"
              onSubmit={(event) => {
                event.preventDefault();
                if (file) uploadMutation.mutate();
              }}
            >
              <input className="focus-ring flex-1 rounded-md border border-line px-3 py-2 text-sm" onChange={(event) => setFile(event.target.files?.[0] || null)} type="file" />
              <button className="focus-ring rounded-md bg-cyan-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={!file || uploadMutation.isPending} type="submit">
                Upload
              </button>
            </form>
          </Panel>

          <Panel title="Documents">
            <div className="divide-y divide-line">
              {documents.map((document) => (
                <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between" key={document.id}>
                  <label className="flex min-w-0 items-center gap-3">
                    <input
                      checked={selectedDocs.includes(document.id)}
                      className="h-4 w-4"
                      onChange={(event) =>
                        setSelectedDocs((current) =>
                          event.target.checked ? [...current, document.id] : current.filter((id) => id !== document.id)
                        )
                      }
                      type="checkbox"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{document.originalName}</span>
                      <span className="block text-xs text-muted">{document.summary || document.processingError || document.fileType}</span>
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <StatusPill status={document.status} />
                    <IconButton label="Reprocess" onClick={() => reprocessMutation.mutate(document.id)}><RefreshCw size={15} /></IconButton>
                    <IconButton label="Delete" onClick={() => deleteDocumentMutation.mutate(document.id)}><Trash2 size={15} /></IconButton>
                  </div>
                </div>
              ))}
              {!documents.length ? <p className="py-6 text-center text-sm text-muted">No documents uploaded yet.</p> : null}
            </div>
          </Panel>

          <Panel icon={Play} title="Workflow actions">
            <div className="space-y-3">
              <textarea className="focus-ring min-h-20 w-full rounded-md border border-line px-3 py-2 text-sm" onChange={(event) => setPrompt(event.target.value)} placeholder="Optional workflow prompt" value={prompt} />
              <input className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm" onChange={(event) => setTopic(event.target.value)} placeholder="Research topic" value={topic} />
              <div className="grid gap-3 sm:grid-cols-2">
                <ActionButton onClick={() => workflowMutation.mutate({ path: 'summarize', body: { prompt } })}>Summarize</ActionButton>
                <ActionButton disabled={selectedDocs.length < 2} onClick={() => workflowMutation.mutate({ path: 'compare', body: { prompt, documentIds: selectedDocs } })}>Compare docs</ActionButton>
                <ActionButton onClick={() => workflowMutation.mutate({ path: 'meeting-action-items', body: { prompt, documentIds: selectedDocs } })}>Action items</ActionButton>
                <ActionButton onClick={() => workflowMutation.mutate({ path: 'research-brief', body: { prompt, topic } })}>Research brief</ActionButton>
              </div>
              {readyDocuments.length === 0 ? <p className="text-xs text-muted">Upload a ready document to ground workflows in citations.</p> : null}
            </div>
          </Panel>

          <Panel title="Recent runs">
            <div className="divide-y divide-line">
              {runs.slice(0, 8).map((run) => (
                <Link className="flex items-center justify-between gap-4 py-3 hover:bg-slate-50" key={run.id} to={`/runs/${run.id}`}>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{run.title}</span>
                    <span className="block text-xs text-muted">{run.type}</span>
                  </span>
                  <StatusPill status={run.status} />
                </Link>
              ))}
              {!runs.length ? <p className="py-6 text-center text-sm text-muted">No workflow runs yet.</p> : null}
            </div>
          </Panel>
        </section>

        <section className="space-y-6">
          <Panel icon={MessageSquareText} title="Chat">
            <div className="flex h-[32rem] flex-col rounded-md border border-line">
              <div className="border-b border-line p-3">
                <select className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm" onChange={(event) => setThreadId(event.target.value)} value={activeThreadId}>
                  <option value="">New thread</option>
                  {threads.map((thread) => <option key={thread.id} value={thread.id}>{thread.title}</option>)}
                </select>
              </div>
              <div className="flex-1 space-y-3 overflow-auto p-3">
                {messages.map((message) => (
                  <div className={`rounded-md p-3 text-sm ${message.role === 'user' ? 'bg-cyan-50' : 'bg-slate-50'}`} key={message.id}>
                    <p className="font-medium capitalize">{message.role}</p>
                    <p className="mt-1 whitespace-pre-wrap">{message.content}</p>
                  </div>
                ))}
                {!messages.length ? <p className="py-8 text-center text-sm text-muted">Ask a question over this workspace.</p> : null}
              </div>
              <form className="border-t border-line p-3" onSubmit={(event) => { event.preventDefault(); if (question.trim()) chatMutation.mutate(); }}>
                <div className="flex gap-2">
                  <input className="focus-ring min-w-0 flex-1 rounded-md border border-line px-3 py-2 text-sm" onChange={(event) => setQuestion(event.target.value)} placeholder="Ask a question..." value={question} />
                  <button className="focus-ring rounded-md bg-cyan-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60" disabled={!question.trim() || chatMutation.isPending} type="submit">Ask</button>
                </div>
              </form>
            </div>
          </Panel>

          <Panel title="Latest output">
            {latestRun ? (
              <div className="space-y-3 text-sm">
                <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(latestRun.output || {}, null, 2)}</pre>
                {(latestRun.citations || []).slice(0, 3).map((citation) => (
                  <div className="rounded-md border border-line p-3" key={citation.chunkId}>
                    <p className="font-medium">{citation.documentName}</p>
                    <p className="mt-1 text-muted">{citation.snippet}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Workflow outputs will appear here after a run completes.</p>
            )}
          </Panel>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md border border-line px-4 py-2">
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function Panel({ icon: Icon, title, children }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <div className="mb-4 flex items-center gap-2">
        {Icon ? <Icon size={18} className="text-cyan-700" /> : null}
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ActionButton({ children, disabled, onClick }) {
  return (
    <button className="focus-ring rounded-md border border-line px-3 py-2 text-left text-sm font-medium hover:bg-slate-50 disabled:opacity-50" disabled={disabled} onClick={onClick} type="button">
      {children}
    </button>
  );
}

function IconButton({ children, label, onClick }) {
  return (
    <button className="focus-ring grid h-9 w-9 place-items-center rounded-md border border-line text-slate-500 hover:bg-slate-50" onClick={onClick} title={label} type="button">
      {children}
    </button>
  );
}
