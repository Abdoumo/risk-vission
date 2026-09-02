import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import AlgoriskLogo from '../components/AlgoriskLogo';

export default function LoginView() {
  const { login } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
    const bodyPayload = isRegistering 
      ? { email, password, name, phone } 
      : { email, password };
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      
      let data;
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        throw new Error(res.ok ? 'Invalid JSON response' : `Server error: ${res.status} ${res.statusText}`);
      }
      
      if (!res.ok) {
        throw new Error(data.error || `Error ${res.status}: Could not connect to server.`);
      }

      if (isRegistering) {
        // Automatically switch to login after successful register, or login directly
        setIsRegistering(false);
        setError('Registration successful. Please log in.');
      } else {
        login(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations — Algerian flag orbs */}
      <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[500px] h-[500px] rounded-full bg-emerald-500/8 blur-[150px] orb-green" />
      <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[500px] h-[500px] rounded-full bg-red-500/6 blur-[150px] orb-red" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-white/[0.02] blur-[100px]" />

      <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl relative z-10 overflow-hidden">
        {/* Algerian flag accent strip */}
        <div className="flag-strip" />
        <div className="p-8">
        
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4">
            <AlgoriskLogo size={56} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-emerald-400">
            RiskVision<span className="text-white">AI</span>
          </h1>
          <p className="text-sm font-medium uppercase tracking-widest text-slate-500 mt-1">
            {isRegistering ? 'Create your account' : 'Access your dashboard'}
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-xl border text-sm text-center font-medium ${error.includes('successful') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all shadow-inner"
                  placeholder="John Doe"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all shadow-inner"
                  placeholder="+213 555 123 456"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all shadow-inner"
              placeholder="admin@riskvision.ai"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password"
              autoComplete="current-password" 
              required 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-all shadow-inner"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex justify-center items-center gap-2 hover:shadow-emerald-500/40"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              isRegistering ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-sm font-medium text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register here"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
