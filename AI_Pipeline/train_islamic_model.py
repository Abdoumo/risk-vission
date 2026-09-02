import os
import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score

def generate_islamic_data(num_samples=5000):
    np.random.seed(42)
    
    # Common features
    client_reliability = np.random.uniform(0.1, 1.0, num_samples)
    supplier_reliability = np.random.uniform(0.1, 1.0, num_samples)
    price_volatility = np.random.uniform(0.01, 0.3, num_samples)
    delivery_probability = np.random.uniform(0.5, 1.0, num_samples)
    
    # Target Risk Score out of 100
    # Higher reliability -> lower risk. Higher volatility -> higher risk
    risk_score = 100 - (client_reliability * 40 + supplier_reliability * 30 + delivery_probability * 30) + (price_volatility * 100)
    
    # Clip to 0-100
    risk_score = np.clip(risk_score, 0, 100)
    
    # Add noise
    risk_score += np.random.normal(0, 5, num_samples)
    risk_score = np.clip(risk_score, 0, 100)
    
    df = pd.DataFrame({
        'client_reliability': client_reliability,
        'supplier_reliability': supplier_reliability,
        'price_volatility': price_volatility,
        'delivery_probability': delivery_probability,
        'target_risk_score': risk_score
    })
    
    return df

def train_islamic():
    print("Generating Islamic Risk dataset...")
    df = generate_islamic_data()
    
    X = df.drop('target_risk_score', axis=1)
    y = df['target_risk_score']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training XGBoost model for Islamic Risk...")
    model = xgb.XGBRegressor(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=4,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    print("RMSE:", np.sqrt(mean_squared_error(y_test, preds)))
    print("R2 Score:", r2_score(y_test, preds))
    
    os.makedirs('models', exist_ok=True)
    model_path = 'models/islamic_model.pkl'
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_islamic()
