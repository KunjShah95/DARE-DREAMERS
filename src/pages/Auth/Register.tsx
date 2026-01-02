import React, { useState } from 'react';
import { Github } from 'lucide-react';
import { getGithubOAuthUrl, getGoogleOAuthUrl } from '../../lib/oauth';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email || !password || !name) {
      setError('Please fill all required fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.message || 'Registration failed.');
        return;
      }

      setSuccess('Registration successful — check your email to verify.');
      setName('');
      setEmail('');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError('Network error. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2">Create your account</h1>
          <p className="text-sm text-zinc-400">Sign up to Dare Dreamers to discover talent and apply.</p>
        </div>

        <div className="space-y-4 mb-6">
          <button
            type="button"
            onClick={() => (window.location.href = getGithubOAuthUrl())}
            className="btn-outline w-full flex items-center justify-center gap-2"
          >
            <Github className="w-4 h-4" /> Sign up with GitHub
          </button>

          <button
            type="button"
            onClick={() => (window.location.href = getGoogleOAuthUrl())}
            className="btn-outline w-full flex items-center justify-center gap-2"
          >
            {/* small Google icon inline */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21.6 12.227c0-.68-.06-1.333-.176-1.96H12v3.72h5.34c-.23 1.24-.92 2.29-1.96 2.98v2.47h3.16c1.86-1.71 2.93-4.24 2.93-7.21z" fill="#4285F4"/>
              <path d="M12 22c2.7 0 4.98-.9 6.64-2.44l-3.16-2.47c-.88.6-2.02.95-3.48.95-2.67 0-4.93-1.8-5.74-4.32H2.96v2.72C4.6 19.9 8 22 12 22z" fill="#34A853"/>
              <path d="M6.26 13.72a6.01 6.01 0 010-3.44V7.56H2.96a9.998 9.998 0 000 8.88l3.3-2.72z" fill="#FBBC05"/>
              <path d="M12 6.5c1.48 0 2.82.51 3.88 1.51l2.9-2.9C16.98 3.6 14.7 2.5 12 2.5 8 2.5 4.6 4.6 2.96 7.56l3.3 2.72C7.07 8.3 9.33 6.5 12 6.5z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-zinc-400">Full name</label>
              <input className="input mt-2 w-full" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-zinc-400">Email</label>
              <input type="email" className="input mt-2 w-full" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-zinc-400">Password</label>
              <input type="password" className="input mt-2 w-full" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <div>
              <label className="text-xs text-zinc-400">Confirm password</label>
              <input type="password" className="input mt-2 w-full" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </div>

            {error && <div className="text-sm text-rose-400">{error}</div>}
            {success && <div className="text-sm text-emerald-400">{success}</div>}

            <div>
              <button className="btn-primary w-full" type="submit">Create account</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
