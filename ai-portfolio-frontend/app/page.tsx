import Link from 'next/link';
import PortfolioDashboard from './components/PortfolioDashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
              AI
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">QuantFolio</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/about" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              About the Tech
            </Link>
            <div className="text-sm font-medium text-slate-400 border border-slate-700 px-3 py-1 rounded-full bg-slate-800/50 hidden sm:block">
              DDPG RL Engine Active
            </div>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
            Dynamic Portfolio Optimization
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Harness the power of Deep Deterministic Policy Gradients (DDPG). Unlike traditional Markowitz models, this AI agent continuously adapts your asset allocation by learning from live market regimes and volatility.
          </p>
        </div>
        

        <div className="flex justify-center">
          <PortfolioDashboard />
        </div>
      </div>
      
      <footer className="border-t border-slate-800 mt-12 py-8 text-center text-slate-500 text-sm">
        <p>Built with Next.js, FastAPI, and Stable Baselines3.</p>
      </footer>
    </main>
  );
}