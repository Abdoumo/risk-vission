model  = LSTMPredictor(input_size=10)   # 10 features : OHLCV + RSI, MACD…
opt    = torch.optim.Adam(model.parameters(), lr=1e-3, weight_decay=1e-4)
sched  = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=50)
loss_fn = nn.BCELoss()
for epoch in range(100):
    model.train()
    pred = model(X_train_tensor)
    loss = loss_fn(pred.squeeze(), y_train_tensor.float())
    opt.zero_grad(); loss.backward(); opt.step(); sched.step()
