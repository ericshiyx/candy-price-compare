const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const puppeteer = require('puppeteer');
const memoryService = require('../services/memoryService');
const axios = require('axios');
const cheerio = require('cheerio');

// Import both scrapers the same way
const vendor1Scraper = require('../scrapers/vendor1Scraper');
const vendor2Scraper = require('../scrapers/vendor2Scraper');

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new product
router.post('/', async (req, res) => {
  try {
    console.log('Received product data:', JSON.stringify(req.body, null, 2));
    
    // Validate required fields
    const requiredFields = ['name', 'vendor1Url', 'vendor2Url', 'vendor1Domain', 'vendor2Domain'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return res.status(400).json({ 
        message: 'Missing required fields', 
        missingFields 
      });
    }
    
    const product = new Product({
      name: req.body.name,
      vendor1Url: req.body.vendor1Url,
      vendor2Url: req.body.vendor2Url,
      vendor1Price: parseFloat(req.body.vendor1Price) || 0,
      vendor2Price: parseFloat(req.body.vendor2Price) || 0,
      vendor1Domain: req.body.vendor1Domain || '',
      vendor2Domain: req.body.vendor2Domain || '',
      imageUrl: req.body.imageUrl || ''
    });

    console.log('Attempting to save product:', JSON.stringify(product, null, 2));
    const savedProduct = await product.save();
    console.log('Successfully saved product:', JSON.stringify(savedProduct, null, 2));
    
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    console.error('Validation errors:', error.errors);
    res.status(400).json({ 
      message: error.message,
      details: error.errors,
      validationErrors: Object.keys(error.errors || {}).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {})
    });
  }
});

// Update prices for a product
router.post('/:id/update-prices', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    const vendor1Price = await vendor1Scraper.scrapePrice(product.vendor1Url);
    
    // Update product with new prices
    product.vendor1Price = vendor1Price;
    product.priceHistory.push({
      vendor1Price,
      vendor2Price: product.vendor2Price
    });

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ timestamp: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function extractDomain(url) {
    try {
        const domain = new URL(url).hostname;
        return domain;
    } catch (error) {
        console.error('Error extracting domain:', error);
        return url;
    }
}

async function scrapeImage(page) {
    try {
        const imageUrl = await page.evaluate(() => {
            // Try different selectors for product images
            const selectors = [
                'meta[property="og:image"]',
                'meta[name="twitter:image"]',
                '.product-image img',
                '.product__image img',
                '#product-image img'
            ];
            
            for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                    if (element.tagName === 'META') {
                        return element.getAttribute('content');
                    } else {
                        return element.getAttribute('src');
                    }
                }
            }
            return null;
        });
        return imageUrl;
    } catch (error) {
        console.error('Error scraping image:', error);
        return null;
    }
}

router.post('/compare-price', async (req, res) => {
    let browser = null;
    try {
        const { name, vendor1Url, vendor2Url } = req.body;
        const vendor1Domain = extractDomain(vendor1Url);
        const vendor2Domain = extractDomain(vendor2Url);

        // Launch browser for scraping
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Scrape prices and image from vendor1
        await page.goto(vendor1Url);
        const vendor1Price = await vendor1Scraper.scrapePrice(vendor1Url);
        const imageUrl = await scrapeImage(page);

        // Scrape price from vendor2
        const vendor2Price = await vendor2Scraper.scrapePrice(vendor2Url);

        // Create and save the new product
        const product = new Product({
            name,
            vendor1Url,
            vendor1Domain,
            vendor2Url,
            vendor2Domain,
            vendor1Price,
            vendor2Price,
            imageUrl,
            timestamp: new Date()
        });

        await product.save();
        
        // Get all products and return them
        const products = await Product.find().sort({ timestamp: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});

router.post('/refresh-prices', async (req, res) => {
    try {
        // Get all products
        const products = await Product.find();
        console.log(`Found ${products.length} products to refresh`);
        
        // Update each product's prices
        for (const product of products) {
            console.log(`\nRefreshing prices for product: ${product.name}`);
            
            console.log('Fetching Vendor 1 price from:', product.vendor1Url);
            const vendor1Price = await vendor1Scraper.scrapePrice(product.vendor1Url);
            console.log('Vendor 1 price:', vendor1Price);
            
            console.log('Fetching Vendor 2 price from:', product.vendor2Url);
            const vendor2Price = await vendor2Scraper.scrapePrice(product.vendor2Url);
            console.log('Vendor 2 price:', vendor2Price);
            
            // Update the product with new prices and timestamp
            await Product.findByIdAndUpdate(product._id, {
                vendor1Price,
                vendor2Price,
                timestamp: new Date()
            });
            console.log('Product updated with new prices');
        }

        // Get updated products
        const updatedProducts = await Product.find().sort({ timestamp: -1 });
        console.log('\nPrice refresh completed successfully');
        res.json(updatedProducts);
    } catch (error) {
        console.error('Error refreshing prices:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update the scrape endpoint to use the same scrapers as refresh
router.post('/scrape', async (req, res) => {
  let browser = null;
  try {
    const { url } = req.body;
    console.log('Scraping URL:', url);
    
    // Always extract domain, even if scraping fails
    const domain = new URL(url).hostname;
    let price = 0;
    let imageUrl = '';

    try {
      // Use the same scrapers that work in the refresh function
      if (domain.includes('candyville.ca')) {
        price = await vendor1Scraper.scrapePrice(url);
        // Get image using puppeteer
        browser = await puppeteer.launch({
          headless: "new",
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url);
        imageUrl = await scrapeImage(page);
      } else if (domain.includes('candynow.ca')) {
        price = await vendor2Scraper.scrapePrice(url);
        // Get image using puppeteer
        browser = await puppeteer.launch({
          headless: "new",
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.goto(url);
        imageUrl = await scrapeImage(page);
      }
    } catch (scrapeError) {
      console.error('Error during scraping:', scrapeError);
      // Don't throw the error, just log it and continue with default values
    }

    const result = {
      price: parseFloat(price) || 0,
      domain,
      imageUrl: imageUrl || ''
    };
    
    console.log('Sending back:', result);
    res.json(result);

  } catch (error) {
    console.error('Error processing scrape request:', error);
    // If we can still get the domain, send it back
    try {
      const domain = new URL(req.body.url).hostname;
      res.json({
        price: 0,
        domain,
        imageUrl: '',
        error: error.message
      });
    } catch (domainError) {
      res.status(400).json({ 
        error: 'Invalid URL',
        details: error.message 
      });
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Reorder a product
router.post('/reorder', async (req, res) => {
  try {
    const { productId, direction } = req.body;

    // Find the product to move
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find the adjacent product based on direction
    let adjacentProduct;
    if (direction === 'up') {
      adjacentProduct = await Product.findOne(
        { sequencenum: { $lt: product.sequencenum } },
        null,
        { sort: { sequencenum: -1 } }
      );
    } else if (direction === 'down') {
      adjacentProduct = await Product.findOne(
        { sequencenum: { $gt: product.sequencenum } },
        null,
        { sort: { sequencenum: 1 } }
      );
    }

    if (!adjacentProduct) {
      return res.status(400).json({ message: 'Cannot move product in that direction' });
    }

    // Swap sequence numbers
    const tempSeq = product.sequencenum;
    product.sequencenum = adjacentProduct.sequencenum;
    adjacentProduct.sequencenum = tempSeq;

    // Save both products
    await Promise.all([
      product.save(),
      adjacentProduct.save()
    ]);

    // Return success
    res.json({ message: 'Product reordered successfully' });
  } catch (error) {
    console.error('Error reordering product:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 