import torch
import torch.nn as nn
import numpy as np
class LSTMPredictor(nn.Module):
    def __init__(self, input_size=10, hidden=128, layers=2, dropout=0.3):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden, layers,
                            batch_first=True, dropout=dropout,
                            bidirectional=False)
        self.attn  = nn.Linear(hidden, 1)   # attention temporelle
        self.head  = nn.Sequential(
            nn.Linear(hidden, 64), nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 1), nn.Sigmoid()
        )
    def forward(self, x):
        out, _ = self.lstm(x)                    # (B, T, H)
        w = torch.softmax(self.attn(out), dim=1) # (B, T, 1)
        ctx = (out * w).sum(dim=1)               # (B, H)
        return self.head(ctx)
