import pandas as pd
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, accuracy_score
from sklearn.preprocessing import LabelEncoder
import joblib
import time
import os

print("Starting AI Training Pipeline...")
print("Loading dataset 'Loan new datset.csv'...")

df = pd.read_csv("DATASETS/Loan new datset.csv")
print(f"Data loaded! Shape: {df.shape}")

# Drop target and irrelevant columns
if 'LoanApproved' not in df.columns and 'RiskScore' not in df.columns:
    print("Could not find target column. Using generic target for demonstration.")
    y = (df['LoanAmount'] > df['LoanAmount'].median()).astype(int)
else:
    target_col = 'LoanApproved' if 'LoanApproved' in df.columns else 'RiskScore'
    y = df[target_col]
    df = df.drop(columns=[target_col])

if 'ApplicationDate' in df.columns:
    df = df.drop(columns=['ApplicationDate'])

print("Preprocessing features...")
# Encode categorical variables
for col in df.columns:
    if df[col].dtype == 'object':
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))

# Handle missing values
df = df.fillna(0)

X = df

print("Splitting data into Train and Validation sets...")
X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training XGBoost Model...")
model = xgb.XGBClassifier(
    n_estimators=100, 
    learning_rate=0.05, 
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric="logloss"
)

start_time = time.time()
model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=10)
end_time = time.time()

print(f"Training completed in {end_time - start_time:.2f} seconds!")

print("Evaluating model...")
val_preds = model.predict_proba(X_val)[:, 1]
val_preds_bin = model.predict(X_val)

try:
    auc = roc_auc_score(y_val, val_preds)
    acc = accuracy_score(y_val, val_preds_bin)
    print(f"Validation AUC: {auc:.4f}")
    print(f"Validation Accuracy: {acc:.4f}")
except Exception as e:
    print(f"Could not compute AUC/Accuracy: {e}")

print("Saving the trained model to 'final_model.pkl'...")
joblib.dump(model, 'final_model.pkl')
print("AI Pipeline finished successfully!")
