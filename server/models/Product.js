const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    vendor1Url: {
        type: String,
        required: true
    },
    vendor1Domain: {
        type: String,
        required: true
    },
    vendor2Url: {
        type: String,
        required: true
    },
    vendor2Domain: {
        type: String,
        required: true
    },
    vendor1Price: {
        type: Number,
        default: null
    },
    vendor2Price: {
        type: Number,
        default: null
    },
    imageUrl: {
        type: String,
        default: null
    },
    sequence: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema); 