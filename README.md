# Dynamic AI Portfolio Optimization using Deep Reinforcement Learning

A full-stack application that uses a **DDPG (Deep Deterministic Policy Gradient)** agent to dynamically optimize investment portfolio allocations in real time. The agent is trained on historical market data and continuously adapts asset weights — outperforming naive buy-and-hold strategies by accounting for transaction costs and market dynamics.

---

## Overview

Traditional portfolio optimization (e.g., Markowitz Mean-Variance) produces a static allocation that doesn't adapt to changing market conditions. This project treats portfolio rebalancing as a **continuous control problem**, where a reinforcement learning agent learns an optimal rebalancing policy directly from price data.

**Key characteristics:**
- Works with any combination of assets: stocks, crypto, commodities, FX pairs
- Reward function penalizes transaction costs to discourage excessive rebalancing
- Backtests AI allocation vs. a passive equal-weight baseline over 6 months
- Trains in ~5,000 timesteps using a rolling 10-day observation window

---

## Architecture

```
┌─────────────────────────────┐       ┌──────────────────────────────────┐
│     Next.js Frontend        │◄─────►│       FastAPI Backend             │
│                             │ HTTP  │                                  │
│  - Ticker input & presets   │       │  GET /train   → Train DDPG agent │
│  - Portfolio pie chart      │       │  GET /predict → Get allocations  │
│  - Backtest line chart      │       │  GET /backtest → Run simulation  │
│  - Price history chart      │       │  GET /history → 6-mo price data  │
└─────────────────────────────┘       └──────────────┬───────────────────┘
                                                      │
                                         ┌────────────▼────────────┐
                                         │   RL Engine              │
                                         │  - Stable-Baselines3    │
                                         │  - Gymnasium Env        │
                                         │  - yfinance data        │
                                         └─────────────────────────┘
```

---

## Tech Stack

**Backend**
| Tool | Version | Purpose |
|---|---|---|
| Python | 3.13 | Core language |
| FastAPI | 0.135.1 | REST API framework |
| Stable-Baselines3 | 2.7.1 | DDPG agent training & inference |
| Gymnasium | 1.2.3 | Custom RL environment |
| yfinance | 1.2.0 | Historical market data |
| Pandas | 3.0.1 | Time-series processing |
| NumPy | 2.4.2 | Numerical computation |

**Frontend**
| Tool | Version | Purpose |
|---|---|---|
| Next.js | latest | React meta-framework (App Router) |
| TypeScript | latest | Type-safe UI code |
| Tailwind CSS | 4.2.1 | Styling |
| Recharts | 3.7.0 | Interactive charts |

---

## Getting Started

### Prerequisites
- Python 3.13+
- Node.js 18+

### Backend

```bash
cd ai-portfolio-backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install fastapi uvicorn stable-baselines3 gymnasium yfinance pandas numpy
uvicorn main:app --reload
```

API available at `http://localhost:8000`

### Frontend

```bash
cd ai-portfolio-frontend
npm install
npm run dev
```

App available at `http://localhost:3000`

---

## Usage

1. **Enter tickers** — type any Yahoo Finance symbols (e.g., `AAPL, BTC-USD, GC=F`) or use a preset template (Crypto, Tech, Macro)
2. **Train the agent** — click "Train AI Agent"; the DDPG model trains for 5,000 timesteps on 6 months of historical data and saves to `live_portfolio_model.zip`
3. **View allocation** — the pie chart shows the AI's recommended portfolio weights for the current market state
4. **Run backtest** — simulates a $10,000 investment over 6 months, comparing the AI strategy against an equal-weight passive baseline

> **Note:** The model must be retrained whenever the set of tickers changes, since the input/output dimensions are fixed at training time.

---

## RL Formulation

| Component | Definition |
|---|---|
| **State** | Rolling 10-day log returns for each asset (flattened) |
| **Action** | Continuous portfolio weights ∈ [0, 1] (softmax-normalized) |
| **Reward** | Portfolio log return minus transaction cost penalty |
| **Agent** | DDPG with Ornstein-Uhlenbeck exploration noise (σ=0.1) |

---

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/train?tickers=AAPL,BTC-USD` | GET | Train DDPG on specified assets |
| `/predict?tickers=AAPL,BTC-USD` | GET | Get current optimal allocation |
| `/history?tickers=AAPL,BTC-USD` | GET | Fetch 6-month price history |
| `/backtest?tickers=AAPL,BTC-USD` | GET | Run AI vs. passive backtest |

---

## Project Structure

```
.
├── ai-portfolio-backend/
│   ├── main.py                  # FastAPI app + RL environment + endpoints
│   └── live_portfolio_model.zip # Saved DDPG model (generated after training)
│
└── ai-portfolio-frontend/
    ├── app/
    │   ├── page.tsx             # Home page
    │   ├── layout.tsx           # Root layout
    │   ├── about/page.tsx       # Architecture documentation
    │   └── components/
    │       └── PortfolioDashboard.tsx  # Main interactive UI
    └── package.json
```

---

## License

MIT
