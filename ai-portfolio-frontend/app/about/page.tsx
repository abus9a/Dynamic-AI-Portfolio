import Link from 'next/link';
import React from 'react';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-20">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">
              AI
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">QuantFolio</h1>
          </div>
          <nav>
            <Link 
              href="/" 
              className="text-sm font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-full bg-slate-800/50 transition-colors"
            >
              &larr; Back to Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-8">
          About the Architecture
        </h1>
        
        <div className="space-y-12 text-slate-300 leading-relaxed text-lg">
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">1. Executive Summary</h2>
            <p>
              This project implements a full-stack financial technology application that uses Deep Reinforcement Learning (RL) to continuously optimize investment portfolios. Unlike traditional static models (like Markowitz Mean-Variance), which rely on historical averages and assumptions of normal distribution, this system utilizes a <strong>Deep Deterministic Policy Gradient (DDPG)</strong> agent. The agent acts as a continuous controller, learning to adapt asset weights dynamically across shifting market regimes while explicitly accounting for transaction costs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">2. System Architecture</h2>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong className="text-blue-400">Frontend (Next.js & React):</strong> A responsive, client-side dashboard built with Tailwind CSS. It handles user inputs, triggers API calls for model training, and visualizes complex financial data using Recharts.</li>
              <li><strong className="text-blue-400">Backend (FastAPI & Python):</strong> A high-performance REST API that acts as the bridge between the user and the AI. It handles data ingestion from Yahoo Finance, processes time-series data using Pandas, and serves the machine learning model.</li>
              <li><strong className="text-blue-400">AI Engine (Stable-Baselines3 & Gymnasium):</strong> The core intelligence of the system. It simulates the stock market as a custom interactive environment where the neural network trains via trial and error.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">3. Reinforcement Learning Formulation</h2>
            <p className="mb-4">
              The core innovation of this project is framing portfolio rebalancing as a reinforcement learning control problem.
            </p>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
              <div>
                <strong className="text-white block mb-1">State/Observation Space:</strong>
                <p className="text-sm">A rolling 10-day window of percentage returns for the selected assets. This allows the agent to "see" recent momentum, volatility, and correlation before making a decision.</p>
              </div>
              <div>
                <strong className="text-white block mb-1">Action Space:</strong>
                <p className="text-sm">A continuous vector representing the target percentage weight for each asset. DDPG naturally outputs continuous actions (e.g., 45.2% Apple, 54.8% Gold), rather than discrete, rigid "Buy/Sell" signals.</p>
              </div>
              <div>
                <strong className="text-white block mb-1">Reward Function:</strong>
                <code className="bg-slate-900 px-2 py-1 rounded text-blue-300 text-sm block my-2">Reward = Portfolio Return - (Transaction Penalty * Sum of Weight Changes)</code>
                <p className="text-sm">It rewards the agent for generating profit, but heavily penalizes it for shifting weights too drastically day-to-day, preventing the AI from losing money to broker fees.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-slate-700 pb-2">4. Key Features & Workflows</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Dynamic Asset Selection:</strong> Train the AI on any combination of global assets (Crypto, Tech, Macro).</li>
              <li><strong>On-Demand Live Training:</strong> Initiates a fresh DDPG training sequence over 5,000 timesteps directly from the browser.</li>
              <li><strong>Real-Time Inference:</strong> Fetches current market data to generate today's optimal portfolio allocation.</li>
              <li><strong>Historical Backtesting Engine:</strong> Simulates a $10,000 investment over the last 6 months to compare the AI against a passive "Buy & Hold" baseline.</li>
            </ul>
          </section>

        </div>
      </div>
    </main>
  );
} 