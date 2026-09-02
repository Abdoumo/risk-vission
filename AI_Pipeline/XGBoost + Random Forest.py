import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier
import ta  # technical analysis
def build_features(df):
    """Construit ~30 features à partir de l'OHLCV."""
    df = df.copy()
    # Momentum
    df["rsi"]    = ta.momentum.RSIIndicator(df["close"], 14).rsi()
    df["macd"]   = ta.trend.MACD(df["close"]).macd_diff()
    df["stoch"]  = ta.momentum.StochasticOscillator(
    bb           = ta.volatility.BollingerBands(df["close"])
    df["bb_w"]   = bb.bollinger_wband()
    df["atr"]    = ta.volatility.AverageTrueRange(
                       df["high"], df["low"], df["close"]).average_true_range()
    # Volume
    df["obv"]    = ta.volume.OnBalanceVolumeIndicator(
                       df["close"], df["volume"]).on_balance_volume()
    # Returns
    for lag in [1, 3, 5, 10]:
        df[f"ret_{lag}d"] = df["close"].pct_change(lag)
    df.dropna(inplace=True)
    return df
xgb_model = xgb.XGBClassifier(
    n_estimators=500, learning_rate=0.03, max_depth=5,
    subsample=0.8, colsample_bytree=0.7,
    early_stopping_rounds=30, eval_metric="logloss"
)
rf_model = RandomForestClassifier(
    n_estimators=300, max_depth=10,
    class_weight="balanced", n_jobs=-1
)
