pip install -r /kaggle/input/datassets/requirements.txt  # assurer vous de changer le chemin d'acces du requirements 

import numpy as np # linear algebra
import pandas as pd # data processing, CSV file I/O (e.g. pd.read_csv)
import seaborn as sn
# Input data files are available in the read-only "../input/" director.ai/competitions/aivkchallengey
# For example, running this (by clicking run or pressing Shift+Enter) will list all files under the input directory

from df_squeezer import df_squeezer
from sklearn.metrics import roc_auc_score, accuracy_score

%load_ext autoreload
%autoreload 2

import gc
import os
import sys
import pandas as pd
import numpy as np
import tqdm
import seaborn as sns


import matplotlib
import matplotlib.pyplot as plt
%matplotlib inline

from sklearn.model_selection import train_test_split, StratifiedKFold, KFold
from sklearn.metrics import roc_auc_score
from sklearn.linear_model import LogisticRegression


pd.set_option('display.max_columns', None)
os.environ["CUDA_VISIBLE_DEVICES"] = '0'

sys.path.append('../')

train = pd.read_parquet("/kaggle/input/datassets/train.parquet") # veillez adpter le chemin d'acces au votre 
test = pd.read_parquet("/kaggle/input/datassets/test.parquet") # veillez adpter le chemin d'acces au votre
train=df_squeezer(train, edit=True, report=False)
test=df_squeezer(test, edit=True, report=False)
train.head()
train.shape
train.isna().sum().sort_values(ascending=False)
#ON constate qu'il n'y pas de valeurs manquantes
train.columns
train['rn'].value_counts()
train.shape
len(train["id"].unique())
def create_global_aggregations_train_test(train, test):
    """
    Crée les agrégations GLOBALES :
    - Fit sur TRAIN uniquement
    - Transform sur TEST (même stats que train)
    """
    # 1. Calcul des agrégations sur TRAIN
    agg_dict = {
        'rn': 'max',
        'pre_loans_credit_limit': ['mean', 'min', 'max', 'std', 'sum'],
        'pre_loans_outstanding': ['sum', 'mean', 'max'],
        'pre_loans_max_overdue_sum': ['max', 'mean', 'sum'],
        'pre_loans_total_overdue': ['sum', 'max', 'mean'],
        'pre_loans_credit_cost_rate': ['mean', 'std', 'min', 'max'],
        'pre_loans_next_pay_summ': ['sum', 'mean', 'max'],
    }
    
    train_agg = train.groupby('id').agg(agg_dict).reset_index()
    train_agg.columns = [
        'id', 'total_loans',
        'avg_credit_limit', 'min_credit_limit', 'max_credit_limit', 'std_credit_limit', 'sum_credit_limit',
        'total_outstanding', 'avg_outstanding', 'max_outstanding',
        'max_overdue_ever', 'avg_max_overdue', 'total_max_overdue',
        'total_overdue_current', 'max_overdue_current', 'avg_overdue_current',
        'avg_credit_cost_rate', 'std_credit_cost_rate', 'min_credit_cost_rate', 'max_credit_cost_rate',
        'total_next_pay_summ', 'avg_next_pay_summ', 'max_next_pay_summ'
    ]
    
    # Remplacer std NaN par 0
    std_cols = [c for c in train_agg.columns if c.startswith('std_')]
    train_agg[std_cols] = train_agg[std_cols].fillna(0)
    
    # 2. Appliquer les mêmes stats au TEST
    test_agg = test[['id']].merge(train_agg, on='id', how='left')
    
    # Pour les clients ABSENTS du train → imputer avec les moyennes du train
    global_means = train_agg.drop(columns='id').mean()
    test_agg = test_agg.fillna(global_means)
    
    return train_agg, test_agg
# === 2. Créer les features SANS leakage ===
train_agg, test_agg = create_global_aggregations_train_test(train, test)

# === 3. Enrichir ===
train_enriched = train.merge(train_agg, on='id', how='left')
test_enriched = test.merge(test_agg, on='id', how='left')

# === 4. Nettoyage mémoire ===
del train, test, train_agg, test_agg
gc.collect()

drop_cols = ['id', 'rn', 'flag']
X = train_enriched.drop(columns=drop_cols)
y = train_enriched['flag']

X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
    loss_function='Logloss',
    eval_metric='AUC',
    task_type="GPU",
    devices='0',
    
    depth=6,
    iterations=200000,
    learning_rate=0.05,
    l2_leaf_reg=10,
    border_count=128,
    bootstrap_type='Bernoulli',   
    subsample=0.8,
    
    auto_class_weights='Balanced',
    early_stopping_rounds=200,
    use_best_model=True,
    random_seed=42,
    verbose=100,
)
#Attendre 9h sous GPU
print("Entraînement sur GPU...")
model.fit(X_train, y_train, eval_set=(X_val, y_val), verbose=100)
# === 7. Évaluation ===
train_preds = model.predict_proba(X_train)[:, 1]
val_preds = model.predict_proba(X_val)[:, 1]
print(f"Train AUC: {roc_auc_score(y_train, train_preds):.6f}")
print(f"Val AUC: {roc_auc_score(y_val, val_preds):.6f}")


test_enriched.head()
# === 8. Prédiction sur test ===
X_test = test_enriched[X_train.columns]
test_preds_full = model.predict_proba(X_test)[:, 1]

# === 9. Ajouter les prédictions ===
test_enriched['pred'] = test_preds_full

# === 10. Agréger par id_x_rn (même ordre que le test original) ===
submission_df = test_enriched.groupby('id_x_rn')['pred'].mean().reset_index()

# === 11. Renommer pour la soumission ===
submission_df.columns = ['id', 'target'] 

# === 12. Vérification ===
print(f"Shape submission : {submission_df.shape}")  # (654068, 2)
assert 'id' in submission_df.columns and 'target' in submission_df.columns
assert len(submission_df) == 654068

# === 13. Sauvegarde ===
submission_df.to_parquet("submission2.parquet", index=False)
print("SUBMISSION PRÊTE À ÊTRE SOUMISE !")
import joblib 
joblib.dump(model,'fianl_cat_model.pkl')
pip install df-squeezer
import pandas as pd
import joblib
import gc
from df_squeezer import df_squeezer
from sklearn.metrics import roc_auc_score
model = joblib.load("/kaggle/input/model-path/fianl_cat_model.pkl") # veillez placer le bon chemin d'acces au model
# Assurez vous de bien  placer les chemin d'acces du datasset d'origine et et du datasset priver 
train = pd.read_parquet("/kaggle/input/datassets/train.parquet") # le chemin  à changer 
private_test  = pd.read_parquet("/kaggle/input/datassets/test.parquet") # le chemin  à changer du test en lechim du private data 

train=df_squeezer(train, edit=True, report=False)
private_test=df_squeezer(private_test, edit=True, report=False)
def create_global_aggregations_train_test(train, test):
    """
    Crée les agrégations GLOBALES :
    - Fit sur TRAIN uniquement
    - Transform sur TEST (même stats que train)
    """
    # 1. Calcul des agrégations sur TRAIN
    agg_dict = {
        'rn': 'max',
        'pre_loans_credit_limit': ['mean', 'min', 'max', 'std', 'sum'],
        'pre_loans_outstanding': ['sum', 'mean', 'max'],
        'pre_loans_max_overdue_sum': ['max', 'mean', 'sum'],
        'pre_loans_total_overdue': ['sum', 'max', 'mean'],
        'pre_loans_credit_cost_rate': ['mean', 'std', 'min', 'max'],
        'pre_loans_next_pay_summ': ['sum', 'mean', 'max'],
    }
    
    train_agg = train.groupby('id').agg(agg_dict).reset_index()
    train_agg.columns = [
        'id', 'total_loans',
        'avg_credit_limit', 'min_credit_limit', 'max_credit_limit', 'std_credit_limit', 'sum_credit_limit',
        'total_outstanding', 'avg_outstanding', 'max_outstanding',
        'max_overdue_ever', 'avg_max_overdue', 'total_max_overdue',
        'total_overdue_current', 'max_overdue_current', 'avg_overdue_current',
        'avg_credit_cost_rate', 'std_credit_cost_rate', 'min_credit_cost_rate', 'max_credit_cost_rate',
        'total_next_pay_summ', 'avg_next_pay_summ', 'max_next_pay_summ'
    ]
    
    # Remplacer std NaN par 0
    std_cols = [c for c in train_agg.columns if c.startswith('std_')]
    train_agg[std_cols] = train_agg[std_cols].fillna(0)
    
    # 2. Appliquer les mêmes stats au TEST
    test_agg = test[['id']].merge(train_agg, on='id', how='left')
    
    # Pour les clients ABSENTS du train → imputer avec les moyennes du train
    global_means = train_agg.drop(columns='id').mean()
    test_agg = test_agg.fillna(global_means)
    
    return train_agg, test_agg
train_agg, private_test_agg = create_global_aggregations_train_test(train, private_test)
train_enriched = train.merge(train_agg, on='id', how='left')
private_test_agg_enriched = private_test.merge(private_test_agg, on='id', how='left')
del train, private_test, train_agg, private_test_agg
gc.collect()
X_train=train_enriched.drop('flag',axis=1)
y_train=train_enriched['flag']
X_private_test=private_test_agg_enriched.drop('flag',axis=1)
y_private_test=private_test_agg_enriched['flag']
train_preds = model.predict_proba(X_train)[:, 1]
print(f"Train AUC: {roc_auc_score(y_train, train_preds):.6f}")

private_data_preds = model.predict_proba(X_private_test)[:, 1]
print(f"Val AUC: {roc_auc_score(y_private_test, private_data_preds):.6f}")