// server.js
const express = require('express');
const dotenv = require('dotenv');

// Initialize dotenv to load environment variables
dotenv.config();

const app = express();

// Read environment variables
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DB_URL;

app.get('/', (req, res) => {
  res.send('Personal Finance Tracker API');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Connected to database at ${DB_URL}`);
});