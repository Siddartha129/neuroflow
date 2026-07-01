import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { api } from '../api/client.js';
import { AuthShell } from '../components/AuthShell.jsx';
import { useAuthStore } from '../store/authStore.js';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      email: 'demo@neuroflow.ai',
      password: 'Password@123'
    }
  });

  async function onSubmit(values) {
    setError('');
    try {
      const { data } = await api.post('/auth/login', values);
      setSession(data);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to log in');
    }
  }

  return (
    <AuthShell title="Log in" subtitle="Continue to your workspaces and document runs.">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
            type="email"
            {...register('email', { required: true })}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
            type="password"
            {...register('password', { required: true })}
          />
        </label>
        {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <button
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 py-2 font-medium text-white hover:bg-cyan-800 disabled:opacity-60"
          disabled={formState.isSubmitting}
          type="submit"
        >
          <LogIn size={16} />
          Log in
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">
        New here?{' '}
        <Link className="font-medium text-cyan-700 hover:text-cyan-800" to="/register">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
