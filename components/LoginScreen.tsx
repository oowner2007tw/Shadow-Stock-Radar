import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Loader2, AlertCircle, Terminal, Wifi, WifiOff, Smartphone } from 'lucide-react';
import { verifyAccessCode, checkSystemStatus } from '../services/authService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Connection Status State
  const [isOnline, setIsOnline] = useState<boolean | null>(null); // null = checking

  useEffect(() => {
    const checkConnection = async () => {
      const status = await checkSystemStatus();
      setIsOnline(status);
    };
    checkConnection();
    // Optional: Poll every 30s
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passcode.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await verifyAccessCode(passcode.trim());
      if (result.success) {
        onLoginSuccess();
      } else {
        setError(result.message || '驗證失敗');
      }
    } catch (err) {
      setError('發生未預期的錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] bg-emerald-900/10 rounded-full blur-[100px]"></div>
         <div className="absolute top-[40%] -right-[10%] w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl animate-fade-in relative">
          
          {/* Status Indicator Badge (Top Right) */}
          <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors ${
             isOnline === null ? 'bg-slate-800 border-slate-700 text-slate-400' :
             isOnline ? 'bg-emerald-900/30 border-emerald-500/30 text-emerald-400' :
             'bg-red-900/30 border-red-500/30 text-red-400'
          }`}>
             {isOnline === null ? (
               <Loader2 className="w-3 h-3 animate-spin" />
             ) : isOnline ? (
               <Wifi className="w-3 h-3" />
             ) : (
               <WifiOff className="w-3 h-3" />
             )}
             {isOnline === null ? 'Checking...' : isOnline ? 'System Online' : 'Offline'}
          </div>

          <div className="flex flex-col items-center mb-8 mt-2">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 shadow-lg border border-slate-700">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Shadow Stock Radar</h1>
            <p className="text-slate-500 text-sm mt-2 font-mono flex items-center gap-2">
              <Lock className="w-3 h-3" /> SECURITY ACCESS
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="passcode" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                Access Passcode
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Terminal className="w-5 h-5" />
                </div>
                <input
                  id="passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  disabled={loading || isOnline === false}
                  className="w-full bg-slate-950/50 border border-slate-700 text-white pl-12 pr-4 py-3.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-700 font-mono tracking-widest text-center text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passcode || isOnline === false}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  存取系統
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </button>
          </form>

          {/* Device Binding Notice */}
          <div className="mt-6 pt-4 border-t border-slate-800/60">
             <div className="flex items-start gap-3 bg-blue-900/10 border border-blue-800/30 p-3 rounded-lg">
                <Smartphone className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="text-xs text-blue-300/80 leading-relaxed">
                  <strong className="text-blue-300 block mb-0.5">裝置綁定機制 (Device Binding)</strong>
                  首次使用通行碼登入後，該代碼將自動與此裝置綁定。之後無法在其他瀏覽器或設備上使用該代碼。
                </div>
             </div>
          </div>
          
          <div className="mt-4 text-center">
             <p className="text-[10px] text-slate-600 font-mono">
               Database: Supabase (PostgreSQL) · Enforced by RLS
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;