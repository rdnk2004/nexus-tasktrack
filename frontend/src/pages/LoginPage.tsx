import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/hooks/useAuthStore';
import { authApi } from '@/api/auth';
import { extractErrorMessage } from '@/api/client';
import { toast } from '@/hooks/useToast';
import { Input, Button } from '@/components/common';
import { ResetPasswordModal } from '@/components/auth/ResetPasswordModal';
import { Layers, Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import { clsx } from 'clsx';

const PRESET_ACCOUNTS = [
  'nikhil@nutmeg.com',
  'jayasree@nutmeg.com',
  'nandana@nutmeg.com',
  'hafeez@nutmeg.com',
  'aldrin@nutmeg.com',
  'sreeraj@nutmeg.com',
  'gopika@nutmeg.com',
  'aswin@nutmeg.com',
  'test@nutmeg.com',
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('nikhil@nutmeg.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      triggerShake();
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      const response = await authApi.login({ email, password });
      login(response);
      toast(`Welcome back, ${email.split('@')[0]}!`, 'success');
      navigate(from, { replace: true });
    } catch (err) {
      const msg = extractErrorMessage(err, 'Invalid credentials. Please try again.');
      setError(msg);
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#050507] flex items-center justify-center p-4 selection:bg-amber-500/30 relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/10 filter blur-[120px]" />
      </div>

      <main className="w-full max-w-md relative z-10">
        <div
          className={clsx(
            'bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.85)] p-8 sm:p-10 relative overflow-hidden transition-all',
            isShaking && 'animate-shake border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
          )}
        >
          {/* Ambient Top Accent Strip */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          {/* Brand Header */}
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Layers className="w-7 h-7 text-amber-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">NUTMEG</h1>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">
              Task &amp; Project Governance
            </p>
          </header>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Operator Email
                </label>
                <span className="text-[10px] text-gray-500">Select preset or type</span>
              </div>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@nutmeg.com"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              {/* Quick Account Selector Pills */}
              <div className="mt-2.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5 font-bold">
                  Quick Select Account:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_ACCOUNTS.map((preset) => {
                    const isSelected = email === preset;
                    const name = preset.split('@')[0];
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className={clsx(
                          'text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all border',
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            : 'bg-black/40 text-gray-400 border-white/5 hover:border-white/15 hover:text-gray-200'
                        )}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsResetOpen(true)}
                  className="text-[11px] text-amber-400/80 hover:text-amber-400 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-300 p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />
              <div className="flex items-center justify-between mt-1.5 px-0.5">
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400/80" /> Default password:
                </span>
                <button
                  type="button"
                  onClick={() => setPassword('password123')}
                  className="text-[11px] font-mono text-amber-400/90 hover:text-amber-300 hover:underline"
                >
                  password123
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Workspace
            </Button>
          </form>
        </div>
      </main>

      {/* Password Reset Modal */}
      <ResetPasswordModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        defaultEmail={email}
      />
    </div>
  );
};
