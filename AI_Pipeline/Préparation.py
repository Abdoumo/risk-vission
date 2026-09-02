def make_sequences(prices, window=60):
    """Prix OHLCV + indicateurs → fenêtre glissante 60 jours."""
    X, y = [], []
    for i in range(window, len(prices)-1):
        X.append(prices[i-window:i])             # 60 pas
        y.append(1 if prices[i+1, 3] > prices[i, 3] else 0)  # close t+1
    return np.array(X), np.array(y)
