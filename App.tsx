
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Wind, Navigation, Info, ExternalLink, MapPin, RefreshCw, AlertCircle, Bell, BellOff, AlertTriangle } from 'lucide-react';
import WindGauge from './components/WindGauge';
import WindChart from './components/WindChart';
import { fetchWindData } from './services/geminiService';
import { WeatherState } from './types';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  
  // Initial state with alert settings from localStorage
  const [state, setState] = useState<WeatherState>(() => {
    const savedThreshold = localStorage.getItem('windThreshold');
    const savedEnabled = localStorage.getItem('alertsEnabled');
    
    return {
      data: null,
      loading: false,
      error: null,
      sources: [],
      alertSettings: {
        threshold: savedThreshold ? parseInt(savedThreshold, 10) : 70,
        enabled: savedEnabled ? savedEnabled === 'true' : true
      }
    };
  });

  const handleSearch = useCallback(async (locationToSearch: string) => {
    if (!locationToSearch.trim()) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await fetchWindData(locationToSearch);
      setState(prev => ({
        ...prev,
        data: result.data,
        loading: false,
        error: null,
        sources: result.sources
      }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err.message || "Nastala nečakaná chyba."
      }));
    }
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setState(prev => ({ ...prev, loading: true }));
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          handleSearch(`${lat}, ${lon}`);
        },
        () => {
          setState(prev => ({ ...prev, loading: false, error: "Nepodarilo sa získať vašu polohu. Zadajte ju ručne." }));
        }
      );
    }
  };

  const updateAlertThreshold = (value: number) => {
    localStorage.setItem('windThreshold', value.toString());
    setState(prev => ({
      ...prev,
      alertSettings: { ...prev.alertSettings, threshold: value }
    }));
  };

  const toggleAlerts = () => {
    const nextState = !state.alertSettings.enabled;
    localStorage.setItem('alertsEnabled', nextState.toString());
    setState(prev => ({
      ...prev,
      alertSettings: { ...prev.alertSettings, enabled: nextState }
    }));
  };

  useEffect(() => {
    handleSearch('Bratislava');
  }, [handleSearch]);

  const isAlertActive = state.data && state.alertSettings.enabled && state.data.speedKmh >= state.alertSettings.threshold;

  const beaufortDescriptions = [
    "Bezvetrie", "Vánok", "Slabý vietor", "Mierny vietor", "Dosť čerstvý vietor", 
    "Čerstvý vietor", "Silný vietor", "Prudký vietor", "Búrlivý vietor", 
    "Víchrica", "Silná víchrica", "Mohutná víchrica", "Orkán"
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-sky-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-600 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-800 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 md:py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-sky-500 rounded-lg shadow-lg shadow-sky-500/20">
                <Wind size={24} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Veterný Monitor Pro
              </h1>
            </div>
            <p className="text-slate-400">Presné údaje a vizualizácia vetra v reálnom čase.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
                placeholder="Mesto alebo región..."
                className="w-full sm:w-64 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSearch(query)}
                disabled={state.loading}
                className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {state.loading ? <RefreshCw size={18} className="animate-spin" /> : 'Hľadať'}
              </button>
              <button
                onClick={getCurrentLocation}
                title="Moja poloha"
                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-300"
              >
                <MapPin size={22} />
              </button>
            </div>
          </div>
        </header>

        {state.error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl flex items-center gap-3 text-red-200">
            <AlertCircle size={24} />
            <p>{state.error}</p>
          </div>
        )}

        {/* High Wind Alert Banner */}
        {isAlertActive && (
          <div className="mb-8 p-5 bg-red-600/20 border-2 border-red-500/50 rounded-3xl flex flex-col md:flex-row items-center gap-4 text-red-100 animate-pulse">
            <div className="p-3 bg-red-500 rounded-2xl shadow-lg shadow-red-500/40">
              <AlertTriangle size={28} className="text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="font-bold text-lg">VÝSTRAHA: Silný vietor!</h3>
              <p className="opacity-90">V lokalite <strong>{state.data?.location}</strong> dosahuje vietor rýchlosť <strong>{state.data?.speedKmh} km/h</strong>, čo prekračuje váš limit {state.alertSettings.threshold} km/h.</p>
            </div>
            <button 
              onClick={toggleAlerts}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-xl text-sm transition-colors"
            >
              Utišiť upozornenia
            </button>
          </div>
        )}

        {state.data && !state.loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl">
                {state.data.visualImageUrl && (
                  <div className="w-full h-48 sm:h-64 relative">
                    <img 
                      src={state.data.visualImageUrl} 
                      alt="Wind visualization" 
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
                    <div className="absolute bottom-4 left-8">
                      <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-950/80 px-2 py-1 rounded border border-sky-800/50">
                        AI Vizualizácia Atmosféry
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-1">{state.data.location}</h2>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Navigation size={14} className="text-sky-500" style={{ transform: `rotate(${state.data.directionDeg}deg)` }} />
                        <span>{state.data.direction} • Smer {state.data.directionDeg}°</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-sky-500/10 text-sky-400 rounded-full text-xs font-bold uppercase tracking-widest border border-sky-500/20">
                        Aktuálne
                      </span>
                      <p className="text-xs text-slate-500 mt-2">Dáta z: {state.data.timestamp}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center justify-around gap-12 py-4">
                    <WindGauge speed={state.data.speedKmh} />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto">
                      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Nárazy</p>
                        <p className="text-2xl font-bold text-white">{state.data.gustsKmh || '--'} <span className="text-sm font-normal text-slate-400">km/h</span></p>
                      </div>
                      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                        <p className="text-slate-500 text-xs font-bold uppercase mb-1">Beaufort</p>
                        <p className="text-2xl font-bold text-white">{state.data.beaufortScale} <span className="text-sm font-normal text-slate-400">/ 12</span></p>
                      </div>
                      <div className="sm:col-span-2 p-4 bg-sky-500/5 rounded-2xl border border-sky-500/10">
                        <p className="text-sky-400 text-xs font-bold uppercase mb-1">Klasifikácia</p>
                        <p className="text-lg font-semibold text-slate-200">{beaufortDescriptions[state.data.beaufortScale] || 'Neznáma'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-800">
                    <div className="flex gap-4 items-start">
                      <Info className="text-sky-500 shrink-0 mt-1" size={20} />
                      <p className="text-slate-300 leading-relaxed italic">
                        "{state.data.description}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <WindChart data={state.data.forecast} />
            </div>

            <div className="space-y-6">
              {/* Notifications Configuration Card */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bell size={18} className="text-sky-500" />
                    <h3 className="text-lg font-bold text-white">Upozornenia</h3>
                  </div>
                  <button 
                    onClick={toggleAlerts}
                    className={`p-2 rounded-lg transition-colors ${state.alertSettings.enabled ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-500'}`}
                  >
                    {state.alertSettings.enabled ? <Bell size={18} /> : <BellOff size={18} />}
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-400">Limit rýchlosti</span>
                      <span className="text-sm font-bold text-sky-400">{state.alertSettings.threshold} km/h</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="150" 
                      step="5"
                      value={state.alertSettings.threshold}
                      onChange={(e) => updateAlertThreshold(parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                    />
                    <div className="flex justify-between mt-1 px-1">
                      <span className="text-[10px] text-slate-600">Slabý</span>
                      <span className="text-[10px] text-slate-600">Orkán</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-800 text-xs text-slate-400">
                    Aplikácia vás upozorní, ak aktuálna rýchlosť vetra v sledovanej oblasti prekročí zvolenú hodnotu.
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4">Detaily vetra</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Rýchlosť (m/s)</span>
                    <span className="font-semibold">{(state.data.speedKmh / 3.6).toFixed(1)} m/s</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Rýchlosť (uzly)</span>
                    <span className="font-semibold">{(state.data.speedKmh * 0.539957).toFixed(1)} kt</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Stabilita</span>
                    <span className={`font-semibold ${state.data.speedKmh > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {state.data.speedKmh > 50 ? 'Nestabilný' : 'Stabilný'}
                    </span>
                  </div>
                </div>
              </div>

              {state.sources.length > 0 && (
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-4">Informačné zdroje</h3>
                  <div className="space-y-3">
                    {state.sources.map((source, idx) => (
                      <a 
                        key={idx}
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-slate-800/30 hover:bg-slate-800 rounded-xl group transition-all"
                      >
                        <span className="text-sm text-slate-300 truncate pr-4">{source.title}</span>
                        <ExternalLink size={14} className="text-slate-500 group-hover:text-sky-500 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6 bg-gradient-to-br from-sky-600/20 to-indigo-600/20 border border-sky-500/20 rounded-3xl shadow-lg">
                <h4 className="font-bold text-sky-300 mb-2">Vedeli ste?</h4>
                <p className="text-sm text-sky-100/70 leading-relaxed">
                  Stupeň 12 na Beaufortovej stupnici (Orkán) začína pri rýchlosti vetra nad 118 km/h. Vtedy sú škody na budovách už veľmi rozsiahle.
                </p>
              </div>
            </div>
          </div>
        )}

        {state.loading && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-sky-500/20 rounded-full animate-ping absolute inset-0"></div>
              <div className="w-20 h-20 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
              <p className="text-xl font-medium text-slate-300">Analyzujeme atmosférické dáta...</p>
              <p className="text-slate-500 mt-2">Gemini hľadá najčerstvejšie informácie o počasí.</p>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-auto py-12 border-t border-slate-900/50 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Veterný Monitor Pro. Poháňané technológiou Gemini 2.5 & 3.</p>
      </footer>
    </div>
  );
};

export default App;
