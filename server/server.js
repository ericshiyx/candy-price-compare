const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('./config/config');

const productRoutes = require('./routes/productRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',  // Local development
    'https://candycompare.netlify.app/'  // Your Netlify domain
  ],
  credentials: true
}));
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Connect to MongoDB
mongoose.connect(config.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/products', productRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
  console.log('Available routes:');
  console.log('  GET  /api/products');
  console.log('  POST /api/compare-price');
  console.log('  POST /api/refresh-prices');
}); 