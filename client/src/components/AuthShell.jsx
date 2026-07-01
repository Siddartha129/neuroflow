import { BrainCircuit } from 'lucide-react';

export function AuthShell({ title, subtitle, children }) {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-cyan-700 text-white">
            <BrainCircuit size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold">NeuroFlow AI</p>
            <p className="text-xs text-muted">Local-first document intelligence</p>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-normal text-ink">{title}</h1>
        <p className="mt-1 text-sm text-muted">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
