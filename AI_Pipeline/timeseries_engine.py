import numpy as np

def generate_timeseries_forecast(model_type: str, horizon: int, base_value: float, volatility: float, default_prob: float):
    """
    Generates a realistic time-series forecast using stochastic and AI-based equations.
    """
    results = []
    
    if model_type == 'islamic_default':
        # Simulate probability of default drift
        drift = 0.005 # slightly increasing risk
        for i in range(1, horizon + 1):
            expected_val = base_value + (drift * i)
            # Add stochastic noise for realism
            noise = np.random.normal(0, volatility * np.sqrt(i))
            current_val = max(0, expected_val + noise)
            
            spread = 1.96 * volatility * np.sqrt(i)
            results.append({
                "day": i,
                "predit": round(current_val, 2),
                "confMin": max(0, round(expected_val - spread, 2)),
                "confMax": round(expected_val + spread, 2)
            })
    else:
        # Asset price models using Monte Carlo Simulation of Geometric Brownian Motion
        drift = 0.0005 if model_type == 'monte_carlo' else 0.0002
        num_simulations = 1000
        dt = 1
        
        # Initialize paths
        paths = np.zeros((horizon + 1, num_simulations))
        paths[0] = base_value
        
        # Precompute random normal matrix for speed
        Z = np.random.standard_normal((horizon, num_simulations))
        
        # Generate stochastic paths
        for t in range(1, horizon + 1):
            # GBM equation: S_t = S_{t-1} * exp((mu - 0.5 * sigma^2) * dt + sigma * sqrt(dt) * Z)
            paths[t] = paths[t-1] * np.exp((drift - 0.5 * volatility**2) * dt + volatility * np.sqrt(dt) * Z[t-1])
            
        for i in range(1, horizon + 1):
            simulated_values_at_i = paths[i]
            
            # Incorporate an LSTM-like auto-regressive smoothing factor for the predicted line
            if i > 1:
                prev_pred = results[-1]['predit']
                alpha = 0.4 # smoothing factor to simulate AI sequence memory (LSTM behavior)
                mean_val = alpha * prev_pred + (1 - alpha) * np.mean(simulated_values_at_i)
            else:
                mean_val = np.mean(simulated_values_at_i)
                
            # Confidence intervals derived directly from Monte Carlo simulation percentiles
            conf_min = np.percentile(simulated_values_at_i, 2.5) # 95% CI lower
            conf_max = np.percentile(simulated_values_at_i, 97.5) # 95% CI upper
            
            results.append({
                "day": i,
                "predit": round(mean_val),
                "confMin": round(conf_min),
                "confMax": round(conf_max)
            })
            
    return results

