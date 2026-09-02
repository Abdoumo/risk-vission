import os
import json
import pandas as pd
import numpy as np

def calculate_portfolio_metrics():
    csv_path = os.path.join('DATASETS', 'sgbv_historical_prices.csv')
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    df = pd.read_csv(csv_path)
    df.set_index('Date', inplace=True)
    
    # Calculate daily returns
    returns = df.pct_change().dropna()
    
    # Define portfolio allocation weights
    weights = {
        'ALLIANCE': 0.15,
        'BIOPHARM': 0.18,
        'CAAR': 0.12,
        'SAIDAL': 0.14,
        'EGH': 0.10,
        'NCA': 0.13,
        'ROUIBA': 0.10,
        'DAHLI': 0.08
    }
    
    # Market Index Returns (Equal weighted for beta calculation)
    market_returns = returns.mean(axis=1)
    
    # Risk-free rate (assumed 3% annualized -> daily = 0.03/252)
    rf_daily = 0.03 / 252
    
    portfolio_assets = []
    
    for ticker, weight in weights.items():
        ticker_returns = returns[ticker]
        
        # Beta
        cov_matrix = np.cov(ticker_returns, market_returns)
        beta = cov_matrix[0, 1] / cov_matrix[1, 1]
        
        # Sharpe (Annualized)
        annualized_return = ticker_returns.mean() * 252
        annualized_volatility = ticker_returns.std() * np.sqrt(252)
        sharpe = (annualized_return - 0.03) / annualized_volatility if annualized_volatility > 0 else 0
        
        # VaR 95% (1-Day Historical)
        var_95 = np.percentile(ticker_returns, 5) * 100 # Convert to percentage
        
        # Expected Shortfall (ES) 95% Historical
        es_95 = ticker_returns[ticker_returns <= np.percentile(ticker_returns, 5)].mean() * 100
        if pd.isna(es_95):
            es_95 = var_95
            
        # Monte Carlo VaR 95% (1-Day)
        mu = ticker_returns.mean()
        sigma = ticker_returns.std()
        np.random.seed(42) # For reproducibility
        simulated_returns = np.random.normal(mu, sigma, 10000)
        mc_var_95 = np.percentile(simulated_returns, 5) * 100
        
        # Risk Categorization
        if abs(var_95) > 4.0:
            risque = "élevé"
        elif abs(var_95) > 2.0:
            risque = "moyen"
        else:
            risque = "faible"
            
        portfolio_assets.append({
            "ticker": ticker,
            "nom": ticker, # simplified
            "secteur": "Secteur", # will hardcode properly in output
            "poids": weight * 100,
            "var95": round(var_95, 2),
            "mcVar95": round(mc_var_95, 2),
            "es95": round(es_95, 2),
            "beta": round(beta, 2),
            "sharpe": round(sharpe, 2),
            "risque": risque
        })
        
    # Map proper names and sectors
    info_map = {
        'ALLIANCE': {'nom': 'Alliance Assurances', 'secteur': 'Assurances'},
        'BIOPHARM': {'nom': 'Biopharm', 'secteur': 'Pharmaceutique'},
        'CAAR': {'nom': 'CAAR', 'secteur': 'Assurances'},
        'SAIDAL': {'nom': 'Groupe Saïdal', 'secteur': 'Pharmaceutique'},
        'EGH': {'nom': 'El Aurassi', 'secteur': 'Hôtellerie'},
        'NCA': {'nom': 'NCA Rouiba', 'secteur': 'Agroalimentaire'},
        'ROUIBA': {'nom': 'AOM Invest', 'secteur': 'Holding'},
        'DAHLI': {'nom': 'Dahli', 'secteur': 'Holding'}
    }
    
    for asset in portfolio_assets:
        asset.update(info_map.get(asset['ticker'], {}))
        
    # Calculate daily portfolio returns for the last 40 days
    # Portfolio return = sum(weight * return)
    portfolio_returns = returns.multiply(pd.Series(weights)).sum(axis=1)
    
    # Generate the VarData for the graph (last 40 days)
    last_40_returns = portfolio_returns.tail(40).values * 100 # percentage
    
    var_95_portfolio = np.percentile(portfolio_returns, 5) * 100
    es_95_portfolio = portfolio_returns[portfolio_returns <= np.percentile(portfolio_returns, 5)].mean() * 100
    
    mu_port = portfolio_returns.mean()
    sigma_port = portfolio_returns.std()
    simulated_port = np.random.normal(mu_port, sigma_port, 10000)
    mc_var_95_portfolio = np.percentile(simulated_port, 5) * 100
    
    var_data = []
    for i, ret in enumerate(last_40_returns):
        jour = f"J-{40 - i}"
        var_data.append({
            "jour": jour,
            "perte": round(ret, 2),
            "var95": round(var_95_portfolio, 2),
            "mcVar95": round(mc_var_95_portfolio, 2),
            "es95": round(es_95_portfolio, 2)
        })
        
    # Export
    output = {
        "portfolio": portfolio_assets,
        "var_data": var_data,
        "global_var95": round(var_95_portfolio, 2),
        "global_mc_var95": round(mc_var_95_portfolio, 2),
        "global_es95": round(es_95_portfolio, 2)
    }
    
    out_path = 'var_results.json'
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
        
    print(f"VaR and Portfolio metrics generated at {out_path}")

if __name__ == "__main__":
    calculate_portfolio_metrics()
