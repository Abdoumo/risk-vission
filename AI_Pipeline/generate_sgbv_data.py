import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_sgbv_data():
    np.random.seed(42)
    
    tickers = {
        'ALLIANCE': {'start_price': 420.0, 'volatility': 0.015, 'drift': 0.0002},
        'BIOPHARM': {'start_price': 1250.0, 'volatility': 0.02, 'drift': 0.0005},
        'CAAR': {'start_price': 3000.0, 'volatility': 0.012, 'drift': 0.0001},
        'SAIDAL': {'start_price': 540.0, 'volatility': 0.025, 'drift': 0.0003},
        'EGH': {'start_price': 1800.0, 'volatility': 0.03, 'drift': -0.0001},
        'NCA': {'start_price': 320.0, 'volatility': 0.018, 'drift': 0.0004},
        'ROUIBA': {'start_price': 210.0, 'volatility': 0.022, 'drift': 0.0002},
        'DAHLI': {'start_price': 105.0, 'volatility': 0.01, 'drift': 0.0001}
    }
    
    days = 252
    end_date = datetime.today()
    dates = [end_date - timedelta(days=x) for x in range(days)]
    dates.reverse()
    
    df = pd.DataFrame({'Date': dates})
    
    # Generate prices using geometric brownian motion
    for ticker, params in tickers.items():
        returns = np.random.normal(params['drift'], params['volatility'], days)
        prices = [params['start_price']]
        for r in returns[1:]:
            prices.append(prices[-1] * (1 + r))
        df[ticker] = prices
        
    os.makedirs('DATASETS', exist_ok=True)
    out_path = 'DATASETS/sgbv_historical_prices.csv'
    df.to_csv(out_path, index=False)
    print(f"Generated {out_path} with {days} days of data.")

if __name__ == "__main__":
    generate_sgbv_data()
