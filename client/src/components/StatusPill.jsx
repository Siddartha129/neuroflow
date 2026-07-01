const styles = {
  uploaded: 'bg-slate-100 text-slate-700',
  processing: 'bg-amber-100 text-amber-800',
  ready: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800',
  queued: 'bg-slate-100 text-slate-700',
  running: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-emerald-100 text-emerald-800'
};

export function StatusPill({ status }) {
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${styles[status] || styles.uploaded}`}>
      {status}
    </span>
  );
}
