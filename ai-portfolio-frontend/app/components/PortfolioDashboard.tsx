'use client';

import React, { useEffect, useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as PieTooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, Legend
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

export default function PortfolioDashboard() {
  const [data, setData] = useState<ChartData[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [backtestData, setBacktestData] = useState<any[]>([]);
  const [currentTickers, setCurrentTickers] = useState<string[]>([]);
  
  const [tickerInput, setTickerInput] = useState("AAPL, GC=F, DX-Y.NYB");

  const [isTraining, setIsTraining] = useState(false);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Enter tickers and click Train AI Agent.');
  const trainingInProgress = React.useRef(false);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8B5CF6'];

  const getTickerQuery = () => `?tickers=${tickerInput.replace(/\s+/g, '')}`;

  const fetchPortfolio = async () => {
    try {
      const res = await fetch(`http://localhost:8000/predict${getTickerQuery()}`);
      const json = await res.json();
      
      if (json.error) {
        setStatusMessage(json.error);
        setData([]);
      } else {
        const formatted = json.tickers.map((name: string, i: number) => ({
          name,
          value: parseFloat((json.weights[i] * 100).toFixed(2)),
        }));
        setData(formatted);
        setCurrentTickers(json.tickers);
        setStatusMessage(`Live weights optimized for: ${json.tickers.join(', ')}`);
      }

      const histRes = await fetch(`http://localhost:8000/history${getTickerQuery()}`);
      const histJson = await histRes.json();
      if (!histJson.error) setHistoryData(histJson.history);

    } catch (error) {
      setStatusMessage('Cannot connect to backend.');
    }
  };

  const handleTrainAgent = async () => {
    if (trainingInProgress.current) return;
    trainingInProgress.current = true;
    setIsTraining(true);
    setData([]);
    setBacktestData([]);
    setStatusMessage(`AI is learning market regimes for ${tickerInput}... (Takes ~20 seconds)`);
    try {
      const trainRes = await fetch(`http://localhost:8000/train${getTickerQuery()}`);
      const trainJson = await trainRes.json();
      if (trainJson.error) {
        setStatusMessage(`Training failed: ${trainJson.error}`);
        return;
      }

      // Poll until training finishes (works whether this call started training or joined an in-progress one)
      await new Promise<void>((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const statusRes = await fetch('http://localhost:8000/training-status');
            const statusJson = await statusRes.json();
            if (statusJson.status === 'done') {
              clearInterval(interval);
              resolve();
            } else if (statusJson.status === 'error') {
              clearInterval(interval);
              reject(new Error(statusJson.error ?? 'Training failed.'));
            }
          } catch {
            clearInterval(interval);
            reject(new Error('Lost connection to backend.'));
          }
        }, 2000);
      });

      setStatusMessage('Training complete! Generating optimal allocation...');
      await fetchPortfolio();
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Cannot connect to backend.'}`);
    } finally {
      trainingInProgress.current = false;
      setIsTraining(false);
    }
  };

  const handleRunBacktest = async () => {
    setIsBacktesting(true);
    setStatusMessage('Simulating 6 months of AI trading data...');
    try {
      const res = await fetch(`http://localhost:8000/backtest${getTickerQuery()}`);
      const json = await res.json();
      if (json.error) {
        setStatusMessage(json.error);
      } else {
        setBacktestData(json.backtest);
        setStatusMessage('Backtest complete. Scroll down to see results.');
      }
    } catch (error) {
      setStatusMessage('Error running backtest.');
    } finally {
      setIsBacktesting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl p-8 bg-white rounded-xl shadow-lg border border-gray-100 my-8 mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">AI Portfolio Manager</h2>
        
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <input 
            type="text" 
            value={tickerInput}
            onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
            placeholder="e.g. BTC-USD, ETH-USD, NVDA"
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900 bg-white"
          />
          <div className="flex gap-2 text-xs">
            <button onClick={() => setTickerInput("BTC-USD, ETH-USD, SOL-USD")} className="text-blue-500 hover:underline">Crypto</button>
            <button onClick={() => setTickerInput("NVDA, AMD, MSFT")} className="text-blue-500 hover:underline">Tech</button>
            <button onClick={() => setTickerInput("SPY, GLD, TLT")} className="text-blue-500 hover:underline">Macro</button>
          </div>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleRunBacktest} 
            disabled={isBacktesting || data.length === 0}
            className={`px-4 py-2 font-semibold rounded-lg shadow transition-colors ${
              isBacktesting || data.length === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isBacktesting ? 'Simulating...' : 'Run Backtest'}
          </button>
          <button 
            onClick={handleTrainAgent} 
            disabled={isTraining}
            className={`px-4 py-2 text-white font-semibold rounded-lg shadow-md transition-colors ${
              isTraining ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isTraining ? 'Training...' : 'Train AI Agent'}
          </button>
        </div>
      </div>
      
      <p className="text-md text-gray-500 mb-8 text-center font-medium h-6">{statusMessage}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        
        {data.length > 0 && (
          <div className="flex flex-col items-center bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Current AI Allocation</h3>
            <div className="w-full h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={(entry: any) => `${entry.name}: ${entry.value}%`}
                  >
                    {data.map((entry: ChartData, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <PieTooltip formatter={(value: any) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {backtestData.length > 0 && (
          <div className="flex flex-col items-center bg-gray-50 p-6 rounded-xl border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Backtest: $10k Investment</h3>
            <div className="w-full h-64">
              <ResponsiveContainer>
                <LineChart data={backtestData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="Date" tick={{ fontSize: 10 }} tickMargin={10} minTickGap={30} />
                  <YAxis domain={['dataMin - 100', 'dataMax + 100']} tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val}`} />
                  <LineTooltip formatter={(value: any) => `$${value}`} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  
                  <Line type="monotone" dataKey="AI Portfolio" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="Passive Baseline" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {historyData.length > 0 && currentTickers.length > 0 && (
        <div className="flex flex-col items-center mt-8">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">6-Month Raw Asset Prices</h3>
          <div className="w-full h-80">
            <ResponsiveContainer>
              <LineChart data={historyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="Date" tick={{ fontSize: 12 }} tickMargin={10} minTickGap={30} />
                <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
                <LineTooltip />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                
                {currentTickers.map((ticker, index) => (
                  <Line key={ticker} type="monotone" dataKey={ticker} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}