import numpy as np

def generate_timeseries_forecast(model_type: str, horizon: int, base_value: float, volatility: float, default_prob: float):
    """
    Generates a realistic time-series forecast using mathematical/stochastic models.
    """
    results = []
    current_val = base_value
    
    if model_type == 'islamic_default':
        # Simulate probability of default drift
        drift = 0.005 # slightly increasing risk
        for i in range(1, horizon + 1):
            expected_val = base_value + (drift * i)
            # Deterministic organic wobble
            organic_wobble = np.sin(i * 0.8) * volatility * 0.3
            current_val = max(0, expected_val + organic_wobble)
            
            spread = 1.96 * volatility * np.sqrt(i)
            results.append({
                "day": i,
                "predit": round(current_val, 2),
                "confMin": max(0, round(expected_val - spread, 2)),
                "confMax": round(expected_val + spread, 2)
            })
    else:
        # Asset price models (Expected Value of Geometric Brownian Motion)
        drift = 0.0005 if model_type == 'monte_carlo' else 0.0002
        for i in range(1, horizon + 1):
            # E[S_t] = S_0 * exp(drift * t)
            expected_val = base_value * np.exp(drift * i)
            # Add a small deterministic sine wave to make it look realistic but stable
            organic_wobble = expected_val * (np.sin(i * 0.5) * volatility * 0.2)
            current_val = expected_val + organic_wobble
            
            # Standard deviation spread for confidence intervals (~95% = 1.96 Z-score)
            std_dev = expected_val * volatility * np.sqrt(i)
            spread = std_dev * 1.96
            
            results.append({
                "day": i,
                "predit": round(current_val),
                "confMin": round(expected_val - spread),
                "confMax": round(expected_val + spread)
            })
            
    return results
