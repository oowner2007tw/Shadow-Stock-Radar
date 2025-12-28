import React, { useState, useEffect } from 'react';
import { Search, Radar, Layers, Zap, Loader2, ArrowUpRight, ArrowDownRight, Activity, TrendingUp, BarChart3, Menu, Terminal, Clock, Info, Cpu, Database, Server, Code, Lock, Sparkles, Calendar, Network, Crown, TrendingDown, Target, Printer, FileText, BrainCircuit, CheckCircle } from 'lucide-react';
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
      
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible">
        <header className="md:hidden h-16 bg-slate-900 border-b border-slate-800 flex items-center px-4 justify-between print:hidden">
           <div className="flex items-center">
             <Radar className="h-6 w-6 text-emerald-500 mr-2" />
             <span className="font-bold text-slate-100">Shadow Radar</span>
           </div>
           <button className="text-slate-400" onClick={handleLogout}><Lock className="h-5 w-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible">
           
           {(activeTab === AnalysisTab.INDIVIDUAL || activeTab === AnalysisTab.THEME) && (
             <div className="max-w-5xl mx-auto mb-8 print:hidden">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                  {activeTab === AnalysisTab.INDIVIDUAL ? 'AI 高勝率個股分析' : '熱門題材與供應鏈解析'}
                </h2>
                
                <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-start">
                   <div className="flex-1 space-y-3">
                      <div className="relative flex items-center shadow-2xl shadow-black/50 rounded-xl">
                          <div className="absolute left-4 text-slate-500">
                            <Search className="h-5 w-5" />
                          </div>
                          <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-32 py-4 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                          placeholder={activeTab === AnalysisTab.INDIVIDUAL ? "輸入台股代號 (如 2330, 2603)..." : "輸入題材 (如 CoWoS, 機器人)..."}
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          />
                          <button 
                          onClick={handleSearch}
                          disabled={loading || !inputValue}
                          className="absolute right-2 top-2 bottom-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '開始分析'}
                          </button>
                      </div>
                      
                      {activeTab === AnalysisTab.THEME && hotTopics.length > 0 && (
                        <div className="flex flex-wrap gap-2 animate-fade-in">
                          <span className="text-xs text-slate-400 flex items-center gap-1"><Sparkles className="h-3 w-3"/> 建議：</span>
                          {hotTopics.map(topic => (
                            <button
                              key={topic.name}
                              onClick={() => setInputValue(topic.name)}
                              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-full transition-colors flex items-center gap-2"
                            >
                              {topic.name}
                              <span className="text-[10px] bg-slate-900 px-1 rounded text-emerald-400">{topic.heatScore}</span>
                            </button>
                          ))}
                        </div>
                      )}
                   </div>

                   {activeTab === AnalysisTab.THEME && (
                      <div className="flex flex-col gap-2">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-2 flex items-center gap-2 h-[60px] flex-shrink-0">
                           <div className="px-2 text-slate-500 flex items-center border-r border-slate-700 h-full">
                              <Calendar className="h-5 w-5" />
                           </div>
                           <input 
                             type="date" 
                             value={startDate} 
                             onChange={(e) => setStartDate(e.target.value)}
                             className="bg-transparent text-slate-200 text-sm focus:outline-none w-[130px] px-1"
                           />
                           <span className="text-slate-600">to</span>
                           <input 
                             type="date" 
                             value={endDate} 
                             onChange={(e) => setEndDate(e.target.value)}
                             className="bg-transparent text-slate-200 text-sm focus:outline-none w-[130px] px-1"
                           />
                        </div>

                        <button
                          onClick={handleAutoDetect}
                          disabled={detecting}
                          className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg py-2 text-sm font-medium flex items-center justify-center gap-2 transition-all"
                        >
                          {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                          自動偵測熱門題材
                        </button>
                      </div>
                   )}
                </div>
             </div>
           )}

           <div className="max-w-6xl mx-auto">
              {loading && (
                 <ProcessingStatus target={inputValue} mode={activeTab as AnalysisTab.INDIVIDUAL | AnalysisTab.THEME} />
              )}

              {error && !loading && (
                <div className="bg-red-900/20 border border-red-800 text-red-300 p-6 rounded-xl text-center">
                  <p>{error}</p>
                </div>
              )}

              {!loading && activeTab === AnalysisTab.SYSTEM_INFO && (
                <div className="animate-fade-in space-y-8 print:hidden">
                  <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 shadow-xl">
                      <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                        <Cpu className="h-8 w-8 text-emerald-500" />
                        系統架構與功能說明 (System Architecture)
                      </h2>
                      <p className="text-slate-400 mb-8 max-w-2xl leading-relaxed">
                        本系統採用 **Hybrid AI + Machine Learning** 混合架構。整合 Google Gemini 3 Flash 的知識圖譜分析能力，與 **8因子特徵工程 (8-Factor Quant)** 驅動的隨機森林模型，實現高勝率的個股趨勢預測。
                      </p>

                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                        <Database className="h-5 w-5 text-blue-400" />
                        核心演算技術 (Core Technologies)
                      </h3>
                      
                      <div className="overflow-hidden rounded-xl border border-slate-700 mb-8 bg-slate-800/20">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-800/80 text-slate-300 text-sm uppercase tracking-wider">
                            <tr>
                              <th className="p-4 border-b border-slate-700 w-1/4">模組名稱 (Module)</th>
                              <th className="p-4 border-b border-slate-700 w-1/4">核心技術 (Methodology)</th>
                              <th className="p-4 border-b border-slate-700 w-1/6">運算模式 (Status)</th>
                              <th className="p-4 border-b border-slate-700">說明 (Description)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800 text-slate-300 text-sm">
                            <tr className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-4 font-bold text-white">Market Data (即時數據)</td>
                              <td className="p-4">Google Search Grounding</td>
                              <td className="p-4"><span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">🟢 Real-time</span></td>
                              <td className="p-4 text-slate-400">即時檢索 VIX、加權季線乖離、融資餘額、三大法人買賣超等 8 大關鍵指標。</td>
                            </tr>
                            <tr className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-4 font-bold text-white">Feature Engineering (特徵工程)</td>
                              <td className="p-4">8-Factor Quant Model</td>
                              <td className="p-4"><span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">📐 Quantitative</span></td>
                              <td className="p-4 text-slate-400">
                                整合 <span className="text-emerald-400">VIX 逆勢指標、乖離率(Macro)、籌碼(Chips)、技術(Tech)</span> 等權重，計算綜合量化分數。
                              </td>
                            </tr>
                            <tr className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-4 font-bold text-white">Trend Prediction (趨勢預測)</td>
                              <td className="p-4">Random Forest (10-Day)</td>
                              <td className="p-4"><span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">🌲 ML Forest</span></td>
                              <td className="p-4 text-slate-400">基於歷史 60 日 K 線特徵與量化評分，透過隨機森林模型預測未來 10 日走勢 (Log Return)。</td>
                            </tr>
                            <tr className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-4 font-bold text-white">Decision Logic (決策層)</td>
                              <td className="p-4">Bias Injection & Threshold</td>
                              <td className="p-4"><span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">⚡ Logic Gate</span></td>
                              <td className="p-4 text-slate-400">嚴格閾值控制：分數 {'>'}65 (Bullish) 加權多方飄移；分數 {'<'}=45 (Bearish) 觸發避險訊號。</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                              <Server className="h-5 w-5 text-emerald-400" />
                              核心架構圖 (Architecture)
                            </h3>
                            <ul className="space-y-4 text-slate-300">
                               <li className="flex items-start gap-4">
                                 <div className="bg-slate-800 p-2 rounded border border-slate-700 shrink-0">
                                     <Code className="h-5 w-5 text-emerald-300" />
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-white text-sm">Frontend Layer</h4>
                                     <p className="text-xs text-slate-400 mt-1">React 19, Tailwind CSS, Recharts (Dual-Line Chart)</p>
                                 </div>
                               </li>
                               <li className="flex items-start gap-4">
                                 <div className="bg-slate-800 p-2 rounded border border-slate-700 shrink-0">
                                     <BrainCircuit className="h-5 w-5 text-blue-300" />
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-white text-sm">AI Core Layer</h4>
                                     <p className="text-xs text-slate-400 mt-1">Gemini 3 Flash Preview, Search Grounding</p>
                                 </div>
                               </li>
                               <li className="flex items-start gap-4">
                                 <div className="bg-slate-800 p-2 rounded border border-slate-700 shrink-0">
                                     <Network className="h-5 w-5 text-purple-300" />
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-white text-sm">Quant Logic Layer</h4>
                                     <p className="text-xs text-slate-400 mt-1">8-Factor Feature Engineering, Random Forest Regressor, Contrarian Strategy</p>
                                 </div>
                               </li>
                            </ul>
                         </div>

                         <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-700/50">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 border-l-4 border-slate-500 pl-3">
                              <Lock className="h-5 w-5 text-slate-400" />
                              未來計畫 (Roadmap)
                            </h3>
                            <ul className="space-y-3 text-slate-400 text-sm">
                               <li className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                 <span>擴大 Random Forest 訓練樣本至 1 年以上</span>
                               </li>
                               <li className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                 <span>整合期貨/選擇權籌碼 (Put/Call Ratio) 因子</span>
                               </li>
                               <li className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                                 <span>新增使用者自訂觀察清單 (Watchlist)</span>
                               </li>
                            </ul>
                         </div>
                      </div>
                  </div>
                </div>
              )}

              {!loading && activeTab === AnalysisTab.INDIVIDUAL && stockResult && (
                <div className="animate-fade-in space-y-6 pb-12 print:pb-0">
                  <div className="flex justify-between items-center mb-4 print:hidden">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Analysis Complete
                      </span>
                    </div>
                    <button 
                      onClick={handlePrint}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      輸出分析報告 (PDF)
                    </button>
                  </div>

                  <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
                    <h1 className="text-3xl font-bold text-slate-900">Shadow Radar 分析報告</h1>
                    <p className="text-slate-600 mt-1">產生日期: {new Date().toLocaleDateString()}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg print:bg-white print:border-slate-300 print:text-black">
                      <div className="text-slate-400 text-xs uppercase tracking-wider print:text-slate-600">Stock Symbol</div>
                      <div className="text-2xl font-bold text-white mt-1 print:text-black">{stockResult.name} <span className="text-lg text-slate-500">({stockResult.symbol})</span></div>
                    </div>
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg print:bg-white print:border-slate-300 print:text-black">
                      <div className="text-slate-400 text-xs uppercase tracking-wider print:text-slate-600">Market Price</div>
                      <div className={`text-2xl font-bold mt-1 ${stockResult.change >= 0 ? 'text-red-400' : 'text-green-400'} print:text-black`}>
                        {stockResult.price}
                        <span className="text-sm ml-2 font-medium bg-opacity-20 px-2 py-0.5 rounded-full bg-slate-800 print:bg-slate-200 print:text-black">
                          {stockResult.change >= 0 ? '▲' : '▼'} {Math.abs(stockResult.change)} ({stockResult.changePercent}%)
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg group relative print:bg-white print:border-slate-300 print:text-black">
                      <div className="text-slate-400 text-xs uppercase tracking-wider flex items-center justify-between print:text-slate-600">
                         Stage A Direction
                      </div>
                      <div className={`text-xl font-bold mt-1 flex items-center gap-2 ${
                        stockResult.stageAPrediction === 'Bullish' ? 'text-red-400' : 
                        stockResult.stageAPrediction === 'Bearish' ? 'text-green-400' : 'text-yellow-400'
                      } print:text-black`}>
                        {stockResult.stageAPrediction === 'Bullish' && <ArrowUpRight className="h-6 w-6" />}
                        {stockResult.stageAPrediction === 'Bearish' && <ArrowDownRight className="h-6 w-6" />}
                        {getPredictionLabel(stockResult.stageAPrediction)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2 bg-slate-800/50 inline-block px-2 py-1 rounded print:bg-slate-100 print:text-slate-600">
                        Tech: Knowledge Graph Fusion
                      </div>
                    </div>

                    <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-lg relative overflow-hidden print:bg-white print:border-slate-300 print:text-black">
                      <div className="text-slate-400 text-xs uppercase tracking-wider flex items-center justify-between print:text-slate-600">
                        Stage B Win Rate
                      </div>
                      <div className="text-3xl font-bold text-emerald-400 mt-1 print:text-black">{stockResult.stageBWinRate}%</div>
                      <div className="text-[10px] text-slate-500 mt-2 bg-slate-800/50 inline-block px-2 py-1 rounded relative z-10 print:bg-slate-100 print:text-slate-600">
                        Algo: Contrarian (逆向思考)
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-6">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2">
                        <EightRadarChart data={stockResult.radarData} />
                        <GBMChart data={stockResult.gbmSimulation} />
                     </div>
                     <div className="break-inside-avoid">
                        <FactorAnalysisGrid data={stockResult.radarData} />
                     </div>
                  </div>

                  <div className="mt-8 break-before-page">
                     <AnalysisReport report={stockResult.analysisReport} />
                  </div>
                </div>
              )}

              {!loading && activeTab === AnalysisTab.THEME && themeResult && (
                <div className="animate-fade-in space-y-6 pb-12">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center shadow-lg">
                        <Zap className="h-10 w-10 text-yellow-500 mb-3" />
                        <div className="text-slate-400 text-sm">市場熱度 (Temperature)</div>
                        <div className="text-5xl font-bold text-white mt-2">{themeResult.temperature}°</div>
                        <div className="text-xs text-slate-500 mt-1">{themeResult.temperature > 80 ? '過熱注意' : '溫度適中'}</div>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center shadow-lg">
                        <Activity className="h-10 w-10 text-purple-500 mb-3" />
                        <div className="text-slate-400 text-sm">噪音等級 (Noise Level)</div>
                        <div className={`text-4xl font-bold mt-2 ${
                          themeResult.noiseLevel === 'Low' ? 'text-emerald-400' : 
                          themeResult.noiseLevel === 'High' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {themeResult.noiseLevel === 'Low' ? '低 (Low)' : themeResult.noiseLevel === 'Medium' ? '中 (Med)' : '高 (High)'}
                        </div>
                      </div>
                      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col justify-center shadow-lg">
                         <div className="text-slate-400 text-sm mb-3 font-semibold">TIER 1 領頭羊</div>
                         <div className="flex flex-wrap gap-2">
                            {themeResult.leadingStocks?.tier1?.map(s => (
                              <span key={s.symbol} className="bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded text-xs border border-emerald-800">{s.name}</span>
                            ))}
                            {(!themeResult.leadingStocks?.tier1 || themeResult.leadingStocks.tier1.length === 0) && <span className="text-slate-500 text-xs">無數據</span>}
                         </div>
                      </div>
                   </div>

                   <div className="my-6">
                     <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Target className="w-6 h-6 text-red-400" />
                        AI 嚴選指標股 (Shadow Radar Selection)
                     </h3>
                     <div className="flex flex-col xl:flex-row gap-6">
                        {renderTierSection("TIER 1: 核心龍頭 (Leaders)", <Crown className="w-5 h-5 text-yellow-400"/>, themeResult.leadingStocks?.tier1 || [], "border-yellow-500/30", "bg-yellow-500/5")}
                        {renderTierSection("TIER 2: 實質受惠 (Supply Chain)", <Network className="w-5 h-5 text-blue-400"/>, themeResult.leadingStocks?.tier2 || [], "border-blue-500/30", "bg-blue-500/5")}
                        {renderTierSection("TIER 3: 潛力/補漲 (Speculative)", <TrendingUp className="w-5 h-5 text-purple-400"/>, themeResult.leadingStocks?.tier3 || [], "border-purple-500/30", "bg-purple-500/5")}
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                      {themeResult.supplyChain?.map((node) => (
                        <div key={node.category} className="bg-slate-900/80 rounded-xl p-5 border border-slate-700 shadow-md">
                          <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                            <Layers className="h-5 w-5 text-blue-400" />
                            <h3 className="font-bold text-white text-lg">{node.category}</h3>
                          </div>
                          <p className="text-sm text-slate-400 mb-4 leading-relaxed">{node.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {node.companies?.map(company => (
                              <span key={company} className="bg-emerald-950 text-emerald-400 border border-emerald-900 px-3 py-1 rounded-full text-sm font-medium hover:bg-emerald-900 transition-colors cursor-pointer">
                                {company}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
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
