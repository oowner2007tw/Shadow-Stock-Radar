import React, { useState, useEffect } from 'react';
import { Search, Radar, Layers, Zap, Loader2, ArrowUpRight, ArrowDownRight, Activity, TrendingUp, BarChart3, Menu, Terminal, Clock, Info, Cpu, Database, Server, Code, Lock, Sparkles, Calendar, Network, Crown, TrendingDown, Target, Printer, FileText, BrainCircuit, CheckCircle, X } from 'lucide-react';
import { analyzeStockWithGemini, analyzeThemeWithGemini, detectMarketTrends } from './services/geminiService';
import EightRadarChart from './components/RadarChart';
import FactorAnalysisGrid from './components/FactorAnalysisGrid';
import GBMChart from './components/GBMChart';
import ProcessingStatus from './components/ProcessingStatus';
import AnalysisReport from './components/AnalysisReport';
import LoginScreen from './components/LoginScreen';
import { AnalysisTab, StockAnalysisResult, ThemeAnalysisResult, HotTopic, TierStock } from './types';

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [activeTab, setActiveTab] = useState<AnalysisTab>(AnalysisTab.INDIVIDUAL);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Date State
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [stockResult, setStockResult] = useState<StockAnalysisResult | null>(null);
  const [themeResult, setThemeResult] = useState<ThemeAnalysisResult | null>(null);
  const [hotTopics, setHotTopics] = useState<HotTopic[]>([]);

  useEffect(() => {
    const session = sessionStorage.getItem('ssr_auth_session');
    if (session === 'valid') {
        setIsAuthenticated(true);
    }
  }, []);

  const handleLoginSuccess = () => {
      setIsAuthenticated(true);
      sessionStorage.setItem('ssr_auth_session', 'valid');
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      sessionStorage.removeItem('ssr_auth_session');
      setStockResult(null);
      setThemeResult(null);
      setInputValue('');
  };

  const handleSearch = async () => {
    if (!inputValue.trim()) return;

    setLoading(true);
    setError(null);
    setStockResult(null);
    setThemeResult(null);
    setIsMobileMenuOpen(false);

    try {
      if (activeTab === AnalysisTab.INDIVIDUAL) {
        const result = await analyzeStockWithGemini(inputValue);
        setStockResult(result);
      } else {
        const result = await analyzeThemeWithGemini(inputValue, startDate, endDate);
        setThemeResult(result);
      }
    } catch (err: any) {
      setError(err.message || '分析失敗，請稍後再試。');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetect = async () => {
    setDetecting(true);
    setHotTopics([]);
    try {
      const topics = await detectMarketTrends(startDate, endDate);
      setHotTopics(topics);
    } catch (err) {
      console.error(err);
    } finally {
      setDetecting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };
  
  const handleMobileTabChange = (tab: AnalysisTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const getPredictionLabel = (pred: string) => {
    switch(pred) {
        case 'Bullish': return '多頭 (Bullish)';
        case 'Bearish': return '空頭 (Bearish)';
        default: return '盤整 (Neutral)';
    }
  };

  const renderTierSection = (title: string, icon: React.ReactNode, stocks: TierStock[], colorClass: string, bgClass: string) => (
    <div className={`rounded-xl border ${colorClass} ${bgClass} p-5 shadow-lg flex-1 min-w-[300px]`}>
        <div className="flex items-center gap-2 mb-4 border-b border-slate-700/50 pb-3">
            {icon}
            <h3 className="font-bold text-lg text-white">{title}</h3>
        </div>
        <div className="space-y-3">
            {stocks.map((stock, idx) => (
                <div key={idx} className="bg-slate-900/60 p-3 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-emerald-400">{stock.name}</span>
                        <span className="text-xs text-slate-500 font-mono">{stock.symbol}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{stock.reason}</p>
                </div>
            ))}
            {stocks.length === 0 && <p className="text-slate-500 text-sm italic">無相關個股</p>}
        </div>
    </div>
  );

  if (!isAuthenticated) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 overflow-hidden print:bg-white print:text-black print:overflow-visible">
      
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 hidden md:flex flex-col print:hidden">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
           <Radar className="h-7 w-7 text-emerald-500 mr-3" />
           <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
             Shadow Radar
           </span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
            <button
                onClick={() => setActiveTab(AnalysisTab.INDIVIDUAL)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                  activeTab === AnalysisTab.INDIVIDUAL 
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <TrendingUp className="h-5 w-5 mr-3" />
                <span className="font-medium">個股分析 (Stock)</span>
            </button>

            <button
                onClick={() => setActiveTab(AnalysisTab.THEME)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                  activeTab === AnalysisTab.THEME 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Layers className="h-5 w-5 mr-3" />
                <span className="font-medium">題材影子 (Theme)</span>
            </button>

            <button
                onClick={() => setActiveTab(AnalysisTab.SYSTEM_INFO)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                  activeTab === AnalysisTab.SYSTEM_INFO 
                    ? 'bg-slate-700/50 text-slate-200 border border-slate-600' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Cpu className="h-5 w-5 mr-3" />
                <span className="font-medium">系統架構資訊</span>
            </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <div className="bg-slate-950 rounded-lg p-3 text-xs text-slate-500">
              <div className="flex items-center gap-2 mb-1 text-slate-400">
                <Activity className="h-3 w-3" /> System Status
              </div>
              <div className="flex justify-between items-center mt-2">
                 <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition-colors">
                    <Lock className="w-3 h-3" /> Logout
                 </button>
              </div>
           </div>
        </div>
      </aside>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            <aside className="relative w-72 h-full bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
                 <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                   <div className="flex items-center">
                     <Radar className="h-7 w-7 text-emerald-500 mr-3" />
                     <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">Shadow Radar</span>
                   </div>
                   <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <button onClick={() => handleMobileTabChange(AnalysisTab.INDIVIDUAL)} className={`w-full flex items-center px-4 py-3 rounded-xl ${activeTab === AnalysisTab.INDIVIDUAL ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400'}`}><TrendingUp className="h-5 w-5 mr-3" />個股分析</button>
                    <button onClick={() => handleMobileTabChange(AnalysisTab.THEME)} className={`w-full flex items-center px-4 py-3 rounded-xl ${activeTab === AnalysisTab.THEME ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400'}`}><Layers className="h-5 w-5 mr-3" />題材影子</button>
                    <button onClick={() => handleMobileTabChange(AnalysisTab.SYSTEM_INFO)} className={`w-full flex items-center px-4 py-3 rounded-xl ${activeTab === AnalysisTab.SYSTEM_INFO ? 'bg-slate-700/50 text-slate-200' : 'text-slate-400'}`}><Cpu className="h-5 w-5 mr-3" />系統資訊</button>
                </nav>
            </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between print:hidden shrink-0">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-400 hover:text-white p-1"><Menu className="h-6 w-6" /></button>
             <div className="flex items-center"><Radar className="h-6 w-6 text-emerald-500 mr-2" /><span className="font-bold text-slate-100">Shadow Radar</span></div>
           </div>
           <button className="text-slate-400" onClick={handleLogout}><Lock className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0">
           {(activeTab === AnalysisTab.INDIVIDUAL || activeTab === AnalysisTab.THEME) && (
             <div className="max-w-5xl mx-auto mb-8 print:hidden">
                <h2 className="text-2xl font-bold text-white mb-6">{activeTab === AnalysisTab.INDIVIDUAL ? 'AI 高勝率個股分析' : '熱門題材解析'}</h2>
                <div className="flex flex-col md:flex-row gap-4">
                   <div className="flex-1">
                      <div className="relative flex items-center shadow-2xl rounded-xl">
                          <div className="absolute left-4 text-slate-500"><Search className="h-5 w-5" /></div>
                          <input type="text" className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-32 py-4 rounded-xl outline-none" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
                          <button onClick={handleSearch} disabled={loading || !inputValue} className="absolute right-2 top-2 bottom-2 bg-emerald-600 px-6 rounded-lg font-medium">{loading ? <Loader2 className="animate-spin h-4 w-4" /> : '分析'}</button>
                      </div>
                   </div>
                </div>
             </div>
           )}

           <div className="max-w-6xl mx-auto">
              {loading && <ProcessingStatus target={inputValue} mode={activeTab as AnalysisTab.INDIVIDUAL | AnalysisTab.THEME} />}
              
              {/* SYSTEM INFO - 重點修復區 */}
              {!loading && activeTab === AnalysisTab.SYSTEM_INFO && (
                <div className="animate-fade-in space-y-8 print:hidden">
                  <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 shadow-xl">
                      <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3"><Cpu className="h-8 w-8 text-emerald-500" /> 系統架構資訊</h2>
                      <div className="overflow-hidden rounded-xl border border-slate-700 mb-8 bg-slate-800/20">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-800/80 text-slate-300 text-sm">
                            <tr><th className="p-4 border-b border-slate-700">模組</th><th className="p-4 border-b border-slate-700">核心技術</th><th className="p-4 border-b border-slate-700">說明</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
                            <tr className="hover:bg-slate-800/50">
                              <td className="p-4 font-bold text-white">Decision Logic</td>
                              <td className="p-4">Threshold</td>
                              {/* 修正符號：使用 {'>'} 與 {'<'} 防止 TS1382 錯誤 */}
                              <td className="p-4 text-slate-400">嚴格閾值控制：分數 {'>'}65 (Bullish) 加權多方；分數 {'<'}45 (Bearish) 觸發避險。</td>
                            </tr>
                            <tr className="hover:bg-slate-800/50">
                              <td className="p-4 font-bold text-white">VIX Contrarian</td>
                              <td className="p-4">Contrarian</td>
                              <td className="p-4 text-slate-400">逆向指標：當 VIX {'>'} 21 時給予加權高分，捕捉恐慌買點。</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                  </div>
                </div>
              )}

              {!loading && activeTab === AnalysisTab.INDIVIDUAL && stockResult && (
                <div className="animate-fade-in space-y-6 pb-12 print:pb-0">
                  <div className="flex justify-between items-center mb-4 print:hidden">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Analysis Complete</span>
                    <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Printer className="w-4 h-4" /> 輸出 PDF 報告</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800"><div className="text-slate-400 text-xs">Symbol</div><div className="text-2xl font-bold">{stockResult.name} <span className="text-base">({stockResult.symbol})</span></div></div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800"><div className="text-slate-400 text-xs">Price</div><div className={`text-2xl font-bold ${stockResult.change >= 0 ? 'text-red-400' : 'text-green-400'}`}>{stockResult.price}</div></div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800"><div className="text-slate-400 text-xs">Direction</div><div className="text-xl font-bold">{getPredictionLabel(stockResult.stageAPrediction)}</div></div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800"><div className="text-slate-400 text-xs">Win Rate</div><div className="text-3xl font-bold text-emerald-400">{stockResult.stageBWinRate}%</div></div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><EightRadarChart data={stockResult.radarData} /><GBMChart data={stockResult.gbmSimulation} /></div>
                  <FactorAnalysisGrid data={stockResult.radarData} />
                  <AnalysisReport report={stockResult.analysisReport} />
                </div>
              )}

              {!loading && activeTab === AnalysisTab.THEME && themeResult && (
                <div className="animate-fade-in space-y-6 pb-12">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-center"><Zap className="h-10 w-10 text-yellow-500 mx-auto mb-3" /><div className="text-5xl font-bold text-white">{themeResult.temperature}°</div></div>
                      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 text-center"><Activity className="h-10 w-10 text-purple-500 mx-auto mb-3" /><div className="text-4xl font-bold text-white">{themeResult.noiseLevel}</div></div>
                      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-wrap gap-2 justify-center items-center">{themeResult.leadingStocks?.tier1?.map(s => (<span key={s.symbol} className="bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded text-xs">{s.name}</span>))}</div>
                   </div>
                   <div className="flex flex-col xl:flex-row gap-6">
                      {renderTierSection("TIER 1: 核心龍頭", <Crown className="w-5 h-5 text-yellow-400"/>, themeResult.leadingStocks?.tier1 || [], "border-yellow-500/30", "bg-yellow-500/5")}
                      {renderTierSection("TIER 2: 實質受惠", <Network className="w-5 h-5 text-blue-400"/>, themeResult.leadingStocks?.tier2 || [], "border-blue-500/30", "bg-blue-500/5")}
                      {renderTierSection("TIER 3: 潛力/補漲", <TrendingUp className="w-5 h-5 text-purple-400"/>, themeResult.leadingStocks?.tier3 || [], "border-purple-500/30", "bg-purple-500/5")}
                   </div>
                </div>
              )}
           </div>
        </div>
      </main>
    </div>
  );
}

export default App;
