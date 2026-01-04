import React from 'react';
import { ArbitrageResult, ArbitrageSignal } from '../types';
import { ArrowRight, ArrowLeft, ArrowRightLeft, Clock, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Globe, DollarSign } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface RevenueArbitrageProps {
  data: ArbitrageResult;
}

const TrendIcon = ({ trend }: { trend: 'UP' | 'DOWN' | 'FLAT' }) => {
  if (trend === 'UP') return <TrendingUp className="w-5 h-5 text-emerald-400" />;
  if (trend === 'DOWN') return <TrendingDown className="w-5 h-5 text-red-400" />;
  return <Minus className="w-5 h-5 text-slate-400" />;
};

const SignalBadge = ({ signal }: { signal: ArbitrageSignal }) => {
  switch (signal) {
    case ArbitrageSignal.OPPORTUNITY:
      return (
        <span className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 animate-pulse">
          <DollarSign className="w-4 h-4" /> 套利機會 (Opportunity)
        </span>
      );
    case ArbitrageSignal.TRAP:
      return (
        <span className="bg-red-500/10 border border-red-500/50 text-red-400 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> 數據背離 (Trap)
        </span>
      );
    case ArbitrageSignal.SYNCED:
      return (
        <span className="bg-blue-500/10 border border-blue-500/50 text-blue-400 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> 已同步 (Synced)
        </span>
      );
    default:
      return <span className="text-slate-500">Unknown</span>;
  }
};

const RevenueArbitrage: React.FC<RevenueArbitrageProps> = ({ data }) => {
  return (
    <div className="animate-fade-in space-y-8 pb-12">
      
      {/* 1. Header & Verdict */}
      <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
           <Globe className="w-32 h-32 text-slate-400" />
        </div>
        
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-2">
              <span className="text-blue-400 font-mono text-sm tracking-wider uppercase">Cross-Border Revenue Reconciler</span>
              <div className="h-[1px] bg-blue-500/30 flex-1"></div>
           </div>
           
           <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
             時差套利尋寶地圖 (Revenue Treasure Map)
           </h2>

           <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-950/50 p-6 rounded-xl border border-slate-800">
              {/* US Side */}
              <div className="flex-1 text-center md:text-left">
                 <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">US Market (Client)</div>
                 <div className="text-2xl font-bold text-white mb-1">{data.usSymbol}</div>
                 <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-slate-300">
                    <TrendIcon trend={data.usSide.trend} />
                    {data.usSide.status}
                 </div>
              </div>

              {/* Connector */}
              <div className="flex flex-col items-center justify-center px-4">
                 <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Lead Time: {data.leadTime}
                 </div>
                 {data.relationType === 'US_LEADS_TW' ? (
                    <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
                       <span>Guidance</span>
                       <ArrowRight className="w-4 h-4" />
                       <span>Revenue</span>
                    </div>
                 ) : data.relationType === 'TW_LEADS_US' ? (
                    <div className="flex items-center gap-2 text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
                       <span>Revenue</span>
                       <ArrowRight className="w-4 h-4" />
                       <span>Earnings</span>
                    </div>
                 ) : (
                    <ArrowRightLeft className="w-6 h-6 text-slate-500" />
                 )}
              </div>

              {/* TW Side */}
              <div className="flex-1 text-center md:text-right">
                 <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">TW Market (Supplier)</div>
                 <div className="text-2xl font-bold text-white mb-1">{data.twSymbol}</div>
                 <div className="flex items-center justify-center md:justify-end gap-2 text-sm text-slate-300">
                    {data.twSide.status}
                    <TrendIcon trend={data.twSide.trend} />
                 </div>
              </div>
           </div>
           
           {/* Verdict Box */}
           <div className="mt-6 flex flex-col items-center justify-center p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-sm mb-2 font-mono">AI CONVICTION SCORE: <span className="text-white font-bold">{data.verdict.score}/100</span></div>
              <SignalBadge signal={data.verdict.signal} />
              <p className="mt-4 text-center text-slate-300 max-w-2xl leading-relaxed">
                 {data.verdict.analysis}
              </p>
           </div>
        </div>
      </div>

      {/* 2. Detailed Evidence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* US Evidence */}
         <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-blue-500 pl-3">
               美股端證據 (US Guidance/Transcript)
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 min-h-[60px]">
               "{data.usSide.evidence}"
            </p>
            <div className="text-xs text-slate-500 font-mono">
               Source: SEC Filings / Earnings Call
            </div>
         </div>

         {/* TW Evidence */}
         <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h3 className="text-lg font-bold text-white mb-4 border-l-4 border-emerald-500 pl-3">
               台股端證據 (Monthly Revenue)
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4 min-h-[60px]">
               "{data.twSide.evidence}"
            </p>
            <div className="text-xs text-slate-500 font-mono">
               Source: TWSE / MOPS
            </div>
         </div>
      </div>

      {/* 3. Action Strategy */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
         <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            操作策略建議 (Actionable Strategy)
         </h3>
         <div className="prose prose-invert prose-sm max-w-none text-slate-300">
            <ReactMarkdown>{data.verdict.strategy}</ReactMarkdown>
         </div>
      </div>
    </div>
  );
};

export default RevenueArbitrage;
