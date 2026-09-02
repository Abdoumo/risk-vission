import xgboost as xgb
from sklearn.model_selection import RandomizedSearchCV

model = xgb.XGBClassifier(
    n_estimators=500,
    learning_rate=0.05,       # Faible LR + plus d'arbres = meilleur
    max_depth=6,
    subsample=0.8,            # Fraction des lignes par arbre
    colsample_bytree=0.8,     # Fraction des features par arbre
    reg_alpha=0.1,            # Régularisation L1
    reg_lambda=1.0,           # Régularisation L2
    use_label_encoder=False,
    eval_metric='logloss',
    early_stopping_rounds=50, # Stop si pas d'amélioration
    random_state=42
)

model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    verbose=100
)
