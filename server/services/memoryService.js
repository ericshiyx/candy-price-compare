let vendor1Products = [];
let vendor2Products = [];

const memoryService = {
    saveVendor1Products(products) {
        vendor1Products = products;
    },

    saveVendor2Products(products) {
        vendor2Products = products;
    },

    getVendor1Products() {
        return vendor1Products;
    },

    getVendor2Products() {
        return vendor2Products;
    },

    clearProducts() {
        vendor1Products = [];
        vendor2Products = [];
    }
};

module.exports = memoryService; 