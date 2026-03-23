const express = require('express');
const app = express();
const port = 5000;

// Simple API endpoint
app.get('/transactions', (req, res) => {
  res.json([
    { id: 1, amount: 100, description: 'Grocery shopping' },
    { id: 2, amount: 50, description: 'Electricity bill' }
  ]);
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});