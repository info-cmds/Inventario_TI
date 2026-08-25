'use client';

import React, { useState } from 'react';
import { MonitorCheck, Lock, Mail, ArrowRight, ShieldCheck, Key } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: any, mustChangePassword: boolean) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      onLoginSuccess(data.user, data.must_change_password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (emailVal: string, passwordVal: string) => {
    setEmail(emailVal);
    setPassword(passwordVal);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#016098] rounded-full blur-3xl opacity-40"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#39BABD] rounded-full blur-3xl opacity-30"></div>
      <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-[#EB567F] rounded-full blur-3xl opacity-20"></div>

      <div className="max-w-md w-full relative z-10 space-y-4">
        {/* Logo Card */}
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 space-y-6">
          <div className="text-center space-y-3">
            <div className="bg-white p-3 rounded-2xl shadow-lg border border-slate-100 inline-block mx-auto">
              <img
                src="/logo-cmds-login.png"
                alt="CMDS Logo"
                className="h-24 w-auto object-contain mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo-cmds.png';
                }}
              />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              CMDS <span className="text-[#39BABD] font-normal">Inventario</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Control de Inventario Tecnológico Multi-Sucursal • CMDS
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] focus:border-transparent outline-none bg-slate-50/50"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#016098] focus:border-transparent outline-none bg-slate-50/50"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#016098] hover:bg-[#014d7a] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#016098]/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4 text-[#39BABD]" />
            </button>
          </form>

          {/* Quick Credential Test Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Acceso Rápido de Prueba (Demo)
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@empresa.com', 'admin123')}
                className="p-2 bg-slate-100 hover:bg-[#EB567F]/10 hover:border-[#EB567F]/30 border border-slate-200 rounded-xl text-center transition-all group"
              >
                <span className="block text-[11px] font-bold text-slate-800 group-hover:text-[#EB567F]">SuperAdmin</span>
                <span className="text-[9px] text-slate-400 block font-mono">Primer Login</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('admin.educacion@empresa.com', 'admin123')}
                className="p-2 bg-slate-100 hover:bg-[#016098]/10 hover:border-[#016098]/30 border border-slate-200 rounded-xl text-center transition-all group"
              >
                <span className="block text-[11px] font-bold text-slate-800 group-hover:text-[#016098]">Admin Edu</span>
                <span className="text-[9px] text-slate-400 block font-mono">Educación</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('lector.valparaiso@empresa.com', 'admin123')}
                className="p-2 bg-slate-100 hover:bg-[#39BABD]/10 hover:border-[#39BABD]/30 border border-slate-200 rounded-xl text-center transition-all group"
              >
                <span className="block text-[11px] font-bold text-slate-800 group-hover:text-[#39BABD]">Lector Val</span>
                <span className="text-[9px] text-slate-400 block font-mono">Valparaíso</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-400 space-y-1">
          <div>Empresa: <strong className="text-slate-200">CMDS</strong></div>
          <div>Desarrollado por: <strong className="text-[#39BABD]">Informática CMDS</strong></div>
        </div>
      </div>
    </div>
  );
}
