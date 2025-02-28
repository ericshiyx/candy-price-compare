const Redis = require('ioredis');
const redis = new Redis();

const VENDOR1_KEY = 'vendor1_products';
const VENDOR2_KEY = 'vendor2_products';

const redisService = {
    async saveVendor1Products(products) {
        await redis.set(VENDOR1_KEY, JSON.stringify(products));
    },

    async saveVendor2Products(products) {
        await redis.set(VENDOR2_KEY, JSON.stringify(products));
    },

    async getVendor1Products() {
        const products = await redis.get(VENDOR1_KEY);
        return JSON.parse(products || '[]');
    },

    async getVendor2Products() {
        const products = await redis.get(VENDOR2_KEY);
        return JSON.parse(products || '[]');
    },

    async clearProducts() {
        await redis.del(VENDOR1_KEY);
        await redis.del(VENDOR2_KEY);
    }
};

module.exports = redisService; 