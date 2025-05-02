import gymnasium as gym
import numpy as np
import pandas as pd
import yfinance as yf
import os
import threading
import traceback
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from stable_baselines3 import DDPG
from stable_baselines3.common.noise import NormalActionNoise


class RealPortfolioEnv(gym.Env):
    def __init__(self, tickers, start="2020-01-01", end="2024-01-01"):
        super(RealPortfolioEnv, self).__init__()

        raw_data = yf.download(tickers, start=start, end=end)['Close']
        raw_data = raw_data.ffill().bfill()
        self.df = raw_data.pct_change().dropna()

        if len(self.df) < 50:
            raise ValueError(f"Not enough data for {tickers}. Check your ticker symbols.")

        self.n_assets = len(tickers)
        self.action_space = gym.spaces.Box(low=0, high=1, shape=(self.n_assets,), dtype=np.float32)
        self.observation_space = gym.spaces.Box(low=-1, high=1, shape=(self.n_assets * 10,), dtype=np.float32)
        self.current_step = 0

    def reset(self, seed=None, options=None):
        super().reset(seed=seed)
        self.current_step = 0
        return self._get_observation(), {}

    def _get_observation(self):
        obs = self.df.iloc[self.current_step : self.current_step + 10].values.flatten()
        return obs.astype(np.float32)

    def step(self, action):
        safe_action = np.abs(action)
        weights = safe_action / (np.sum(safe_action) + 1e-8)
        returns = self.df.iloc[self.current_step + 10].values
        reward = np.dot(weights, returns) - 0.001 * np.sum(np.abs(weights))
        self.current_step += 1
        terminated = self.current_step >= len(self.df) - 11
        return self._get_observation(), float(reward), bool(terminated), False, {}


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global training state
training_state = {"status": "idle", "error": None}
training_lock = threading.Lock()


def run_training(ticker_list: list):
    global training_state
    try:
        print(f"Training started for: {ticker_list}")
        env = RealPortfolioEnv(ticker_list)
        n_actions = env.action_space.shape[-1]
        action_noise = NormalActionNoise(mean=np.zeros(n_actions), sigma=0.1 * np.ones(n_actions))
        model = DDPG("MlpPolicy", env, action_noise=action_noise, verbose=1)
        model.learn(total_timesteps=5000)
        model.save("live_portfolio_model")
        print("Model saved.")
        with training_lock:
            training_state = {"status": "done", "error": None}
    except Exception as e:
        error_details = traceback.format_exc()
        print("TRAINING ERROR:\n", error_details)
        with training_lock:
            training_state = {"status": "error", "error": str(e)}


@app.get("/train")
def train(tickers: str = "AAPL,MSFT,SPY"):
    global training_state
    with training_lock:
        if training_state["status"] == "running":
            return {"status": "running", "message": "Training already in progress."}
        training_state = {"status": "running", "error": None}

    ticker_list = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    thread = threading.Thread(target=run_training, args=(ticker_list,), daemon=True)
    thread.start()
    return {"status": "started", "message": f"Training started for {ticker_list}"}


@app.get("/training-status")
def training_status():
    with training_lock:
        return dict(training_state)


@app.get("/predict")
def predict(tickers: str = "AAPL,GC=F,DX-Y.NYB"):
    ticker_list = [t.strip().upper() for t in tickers.split(",")]
    if not os.path.exists("live_portfolio_model.zip"):
        return {"error": "Model not trained yet."}

    try:
        model = DDPG.load("live_portfolio_model")
        raw_data = yf.download(ticker_list, period="2mo")['Close'].ffill().dropna()
        data = raw_data.pct_change().dropna()

        if len(data) < 10:
            return {"error": "Not enough recent data to make a prediction."}

        obs = data.tail(10).values.flatten().astype(np.float32)
        action, _ = model.predict(obs)
        safe_action = np.abs(action)
        weights = (safe_action / (np.sum(safe_action) + 1e-8)).tolist()
        return {"weights": weights, "tickers": ticker_list}
    except ValueError:
        return {"error": "Asset count mismatch. Retrain the model for these tickers."}
    except Exception as e:
        return {"error": str(e)}


@app.get("/history")
def get_history(tickers: str = "AAPL,GC=F,DX-Y.NYB"):
    ticker_list = [t.strip().upper() for t in tickers.split(",")]
    try:
        data = yf.download(ticker_list, period="6mo")['Close'].ffill().dropna().reset_index()
        data['Date'] = data['Date'].dt.strftime('%b %d, %Y')
        records = data.to_dict(orient="records")
        return {"history": records, "tickers": ticker_list}
    except Exception as e:
        return {"error": str(e)}


@app.get("/backtest")
def backtest(tickers: str = "AAPL,GC=F,DX-Y.NYB"):
    ticker_list = [t.strip().upper() for t in tickers.split(",")]
    if not os.path.exists("live_portfolio_model.zip"):
        return {"error": "Model not trained yet."}

    try:
        model = DDPG.load("live_portfolio_model")
        raw_data = yf.download(ticker_list, period="6mo")['Close'].ffill().dropna()
        returns_df = raw_data.pct_change().dropna()

        initial_capital = 10000.0
        ai_value = initial_capital
        baseline_value = initial_capital
        backtest_history = []

        for i in range(10, len(returns_df) - 1):
            obs = returns_df.iloc[i-10:i].values.flatten().astype(np.float32)
            action, _ = model.predict(obs)
            ai_weights = np.abs(action) / (np.sum(np.abs(action)) + 1e-8)
            baseline_weights = np.ones(len(ticker_list)) / len(ticker_list)

            next_returns = returns_df.iloc[i].values
            ai_step_return = np.dot(ai_weights, next_returns) - 0.001 * np.sum(np.abs(ai_weights))
            baseline_step_return = np.dot(baseline_weights, next_returns)

            ai_value = ai_value * (1 + ai_step_return)
            baseline_value = baseline_value * (1 + baseline_step_return)

            date_str = returns_df.index[i].strftime('%b %d')
            backtest_history.append({
                "Date": date_str,
                "AI Portfolio": round(ai_value, 2),
                "Passive Baseline": round(baseline_value, 2)
            })

        return {"backtest": backtest_history}
    except Exception as e:
        return {"error": "Error during backtest. Did you train the model on these specific assets first?"}
