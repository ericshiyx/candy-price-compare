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
    sequencenum: {
        type: Number,
        default: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Add a pre-save hook to set sequencenum for new products
productSchema.pre('save', async function(next) {
    if (this.isNew) {
        try {
            const lastProduct = await this.constructor.findOne({}, {}, { sort: { 'sequencenum': -1 } });
            this.sequencenum = lastProduct ? lastProduct.sequencenum + 1 : 0;
        } catch (error) {
            console.error('Error setting sequence number:', error);
            this.sequencenum = 0;
        }
    }
    next();
});

module.exports = mongoose.model('Product', productSchema); 