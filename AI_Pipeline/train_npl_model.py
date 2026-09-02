import os
import pandas as pd
import numpy as np
import lightgbm as lgb
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

def generate_npl_data(num_samples=5000):
    np.random.seed(42)
    
    # Features
    income = np.random.normal(100000, 30000, num_samples)
    debt_ratio = np.random.uniform(0.1, 0.8, num_samples)
    late_payments = np.random.poisson(1, num_samples)
    cash_flow = income * np.random.uniform(0.2, 0.8, num_samples)
    utilization_rate = np.random.uniform(0.1, 0.95, num_samples)
    payment_delay_days = late_payments * np.random.randint(5, 30, num_samples)
    
    # Calculate target (default_within_90_days)
    # Higher debt ratio, more late payments, high utilization -> higher chance of default
    risk_score = (debt_ratio * 3) + (late_payments * 0.5) + (utilization_rate * 2) - (cash_flow / 50000)
    
    # Add less noise to make it highly predictable
    risk_score += np.random.normal(0, 0.2, num_samples)
    
    # Convert to binary target
    threshold = np.percentile(risk_score, 85) # Top 15% default
    target = (risk_score > threshold).astype(int)
    
    df = pd.DataFrame({
        'income': income,
        'debt_ratio': debt_ratio,
        'late_payments': late_payments,
        'cash_flow': cash_flow,
        'utilization_rate': utilization_rate,
        'payment_delay_days': payment_delay_days,
        'default_within_90_days': target
    })
    
    return df

def train_npl():
    print("Generating NPL dataset...")
    df = generate_npl_data()
    
    X = df.drop('default_within_90_days', axis=1)
    y = df['default_within_90_days']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training LightGBM model for NPL...")
    model = lgb.LGBMClassifier(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=5,
        is_unbalance=True,
        random_state=42
    )
    model.fit(X_train, y_train)
    
    preds = model.predict(X_test)
    print("Accuracy:", accuracy_score(y_test, preds))
    print("F1 Score:", f1_score(y_test, preds))
    
    os.makedirs('models', exist_ok=True)
    model_path = 'models/npl_model.pkl'
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_npl()
