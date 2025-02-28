const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const productRoutes = require('./routes/productRoutes');

const app = express();

// Add more detailed CORS configuration
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// Test route to verify server is working
app.get('/test', (req, res) => {
    console.log('Test route hit');
    res.json({ message: 'Server is working' });
});

// Log all incoming requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// More detailed MongoDB connection logging
mongoose.connect('mongodb://localhost:27017/candy-price-compare')
    .then(() => {
        console.log('Successfully connected to MongoDB.');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

// Add error handling for MongoDB connection
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

// Add basic error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.use('/api', productRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('API endpoints:');
    console.log('  GET  /api/products');
    console.log('  POST /api/compare-price');
    console.log('  POST /api/refresh-prices');
    console.log('Ready to handle requests');
}); 