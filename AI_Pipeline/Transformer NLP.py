from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
# FinBERT : pré-entraîné sur textes financiers
MODEL_NAME = "ProsusAI/finbert"
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
nlp_model  = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
# labels : 0=négatif, 1=neutre, 2=positif
def get_sentiment_score(texts: list[str]) -> np.ndarray:
    """Retourne un score [-1, +1] par texte."""
    inputs = tokenizer(texts, padding=True, truncation=True,
                       max_length=512, return_tensors="pt")
    with torch.no_grad():
        logits = nlp_model(**inputs).logits
    probs = torch.softmax(logits, dim=-1).numpy()
    # Score = P(positif) - P(négatif)
    return probs[:, 2] - probs[:, 0]
