from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score

model = RandomForestClassifier(
    n_estimators=300,      # Nombre d'arbres
    max_depth=None,        # Profondeur max (None = illimitée)
    min_samples_split=5,   # Min samples pour splitter un nœud
    max_features='sqrt',   # Features considérées par split
    class_weight='balanced', # Gestion du déséquilibre
    n_jobs=-1,             # Parallélisation
    random_state=42
)
scores = cross_val_score(model, X_train, y_train, cv=5, scoring='f1_macro')
print(f"F1 moyen : {scores.mean():.3f} ± {scores.std():.3f}")
