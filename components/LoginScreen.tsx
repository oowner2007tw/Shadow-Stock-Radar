import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Loader2, AlertCircle, Terminal, Wifi, WifiOff, Smartphone, TrendingUp, BarChart3, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { verifyAccessCode, checkSystemStatus } from '../services/authService';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

// Background Component: Abstract Candlesticks
const CandlestickBackground = () => {
  // Generate random candle data for visual effect
  const candles = Array.from({ length: 20 }).map((_, i) => ({
    height: Math.random() * 60 + 20 + 'px',
    left: `${(i * 5) + Math.random() * 2}%`,
    top: Math.random() * 80 + 10 + '%',
    isBullish: Math.random() > 0.45,
    delay: Math.random() * 5 + 's',
    duration: Math.random() * 3 + 2 + 's'
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      {candles.map((candle, idx) => (
        <div 
          key={idx}
          className={`absolute w-1.5 rounded-sm animate-pulse ${candle.isBullish ? 'bg-emerald-500' : 'bg-red-500'}`}
          style={{
            height: candle.height,
            left: candle.left,
            top: candle.top,
            animationDelay: candle.delay,
            animationDuration: candle.duration,
            boxShadow: candle.isBullish ? '0 0 10px rgba(16, 185, 129, 0.5)' : '0 0 10px rgba(239, 68, 68, 0.5)'
          }}
        >
          {/* Wick */}
          <div className={`absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] -my-4 ${candle.isBullish ? 'bg-emerald-500/50' : 'bg-red-500/50'}`}></div>
        </div>
      ))}
    </div>
  );
};

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
    <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* 1. Technical Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
      
      {/* 2. Radial Gradient Overlay (Vignette) */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#02040a]/80 to-[#02040a] pointer-events-none"></div>

      {/* 3. Animated Candlesticks Layer */}
      <CandlestickBackground />

      {/* 4. Main Login Container - Terminal Style */}
      <div className="relative z-10 w-full max-w-[420px]">
        
        {/* Decorative Top Line */}
        <div className="flex items-center justify-between mb-2 px-1">
           <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-emerald-500/80 tracking-widest uppercase">
                 Quant_Terminal_v2.0
              </span>
           </div>
           <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase transition-colors ${
             isOnline === null ? 'bg-slate-900 border-slate-700 text-slate-500' :
             isOnline ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400' :
             'bg-red-950/50 border-red-500/30 text-red-400'
           }`}>
             <div className={`w-1.5 h-1.5 rounded-full ${isOnline === true ? 'bg-emerald-500 animate-pulse' : isOnline === false ? 'bg-red-500' : 'bg-slate-500'}`}></div>
             {isOnline === null ? 'CONN...' : isOnline ? 'ONLINE' : 'OFFLINE'}
           </div>
        </div>

        <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-slate-700 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
          
          {/* Header Section */}
          <div className="relative p-8 pb-6 border-b border-slate-700/50 bg-gradient-to-b from-slate-800/50 to-transparent">
             {/* Glowing accent line at top */}
             <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
             
             <div className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                   <div className="w-14 h-14 bg-slate-900/80 rounded-xl flex items-center justify-center border border-slate-600 shadow-inner group">
                      <TrendingUp className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition-transform duration-500" />
                   </div>
                   {/* Decorative orbiting dot */}
                   <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-[#0f172a] animate-bounce"></div>
                </div>

                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  SHADOW RADAR
                </h1>
                <p className="text-slate-400 text-xs mt-1.5 font-mono tracking-wider">
                  AI-DRIVEN MARKET INTELLIGENCE
                </p>
             </div>
          </div>

          {/* Form Section */}
          <div className="p-8 pt-6">
            <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="passcode" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Authorized Access Key
                  </label>
                  <Lock className="w-3 h-3 text-slate-500" />
                </div>
                
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center text-slate-500 group-focus-within:text-emerald-400 transition-colors">
                    <Terminal className="w-4 h-4" />
                  </div>
                  <input
                    id="passcode"
                    type="password"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    disabled={loading || isOnline === false}
                    className="w-full bg-[#020617] border border-slate-700 text-emerald-400 pl-10 pr-4 py-3 rounded hover:border-slate-600 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-800 font-mono tracking-[0.2em] text-center text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
                    placeholder="ENTER CODE"
                    autoFocus
                    autoComplete="off"
                  />
                  {/* Blinking Cursor Simulation (if empty) */}
                  {!passcode && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-4 bg-emerald-500/20 animate-pulse pointer-events-none"></div>
                  )}
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border-l-2 border-red-500 p-3 flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-200 font-medium leading-snug">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !passcode || isOnline === false}
                className="w-full relative overflow-hidden bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 disabled:cursor-not-allowed group border border-emerald-500/50"
              >
                <div className="absolute inset-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <div className="flex items-center justify-center gap-2 relative z-10">
                  {loading ? (
                    <>
                       <Loader2 className="w-4 h-4 animate-spin" />
                       <span className="text-xs tracking-widest">VERIFYING...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xs tracking-widest">INITIALIZE SESSION</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Footer / Device Info */}
            <div className="mt-6 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-4">
               <div className="flex flex-col gap-1">
                 <span className="text-[9px] text-slate-500 uppercase font-bold">Security Protocol</span>
                 <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <ShieldCheck className="w-3 h-3 text-blue-400" />
                    <span>Device Binding</span>
                 </div>
               </div>
               <div className="flex flex-col gap-1 text-right">
                 <span className="text-[9px] text-slate-500 uppercase font-bold">Encryption</span>
                 <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
                    <span>RLS / SSL</span>
                    <Lock className="w-3 h-3 text-emerald-400" />
                 </div>
               </div>
            </div>
          </div>
          
          {/* Bottom Running Ticker Decoration (CSS Animation) */}
          <div className="bg-black/40 py-1.5 flex overflow-hidden border-t border-slate-800">
             <div className="flex items-center gap-8 whitespace-nowrap animate-[marquee_20s_linear_infinite] text-[9px] font-mono text-slate-500">
                <span className="flex items-center gap-1"><span className="text-emerald-500">●</span> SYSTEM_READY</span>
                <span className="flex items-center gap-1">VIX_INDEX <span className="text-red-400">HI_VOL</span></span>
                <span className="flex items-center gap-1">SEARCH_GROUNDING <span className="text-emerald-400">ACTIVE</span></span>
                <span className="flex items-center gap-1">RANDOM_FOREST <span className="text-emerald-400">LOADED</span></span>
                <span className="flex items-center gap-1">LATENCY <span className="text-blue-400">24ms</span></span>
                {/* Duplicate for seamless loop */}
                <span className="flex items-center gap-1"><span className="text-emerald-500">●</span> SYSTEM_READY</span>
                <span className="flex items-center gap-1">VIX_INDEX <span className="text-red-400">HI_VOL</span></span>
                <span className="flex items-center gap-1">SEARCH_GROUNDING <span className="text-emerald-400">ACTIVE</span></span>
             </div>
          </div>
        </div>
        
        {/* Footer Text */}
        <div className="text-center mt-6 opacity-40 hover:opacity-100 transition-opacity">
           <p className="text-[9px] text-slate-400 font-mono">
             SHADOW STOCK RADAR © {new Date().getFullYear()}
           </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;