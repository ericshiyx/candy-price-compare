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
    const products = await Product.find().sort({ sequence: 1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Add a new product
router.post('/', async (req, res) => {
  try {
    // Log received data
    console.log('Server received data:', req.body);

    // Validate required fields
    if (!req.body.name) {
      return res.status(400).json({ message: 'Product name is required' });
    }

    if (!req.body.vendor1Url || !req.body.vendor2Url) {
      return res.status(400).json({ message: 'Both vendor URLs are required' });
    }

    const product = new Product({
      name: req.body.name,
      vendor1Url: req.body.vendor1Url,
      vendor2Url: req.body.vendor2Url,
      vendor1Price: req.body.vendor1Price || 0,
      vendor2Price: req.body.vendor2Price || 0,
      vendor1Domain: req.body.vendor1Domain || '',
      vendor2Domain: req.body.vendor2Domain || '',
      imageUrl: req.body.imageUrl || '',
      sequence: 0  // Add default sequence
    });

    const savedProduct = await product.save();
    console.log('Product saved:', savedProduct);
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Server error:', error);
    res.status(400).json({ 
      message: error.message,
      details: error.errors // Include mongoose validation errors if any
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

/* router.post('/auto-compare', async (req, res) => {
    try {
        // Launch browser for scraping
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        // Scrape Vendor 1 products
        console.log('Scraping Vendor 1 products...');
        const vendor1Products = await scrapeVendor1Products(browser);
        memoryService.saveVendor1Products(vendor1Products);

        // Scrape Vendor 2 products
        console.log('Scraping Vendor 2 products...');
        const vendor2Products = await scrapeVendor2Products(browser);
        memoryService.saveVendor2Products(vendor2Products);

        // Find matching products
        const matches = await findMatchingProducts(vendor1Products, vendor2Products);
        console.log(`Found ${matches.length} matching products`);

        // Save matches to MongoDB
        for (const match of matches) {
            const product = new Product({
                name: match.name,
                vendor1Url: match.vendor1Url,
                vendor1Domain: extractDomain(match.vendor1Url),
                vendor2Url: match.vendor2Url,
                vendor2Domain: extractDomain(match.vendor2Url),
                vendor1Price: match.vendor1Price,
                vendor2Price: match.vendor2Price,
                imageUrl: match.imageUrl,
                timestamp: new Date()
            });
            await product.save();
        }

        // Clean up
        memoryService.clearProducts();
        await browser.close();

        // Return updated product list
        const allProducts = await Product.find().sort({ timestamp: -1 });
        res.json(allProducts);
    } catch (error) {
        console.error('Error in auto-compare:', error);
        res.status(500).json({ error: error.message });
    }
}); */

/* async function scrapeVendor1Products(browser) {
    const page = await browser.newPage();
    
    try {
        console.log('Starting to scrape Candyville.ca...');
        
        await page.setDefaultNavigationTimeout(60000);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log('Navigating to Candyville.ca shop page...');
        await page.goto('https://candyville.ca/', {
            waitUntil: 'networkidle0'
        });

        // Close any popups that might appear
        try {
            await page.waitForSelector('.scappfancybox-close', { timeout: 5000 });
            await page.click('.scappfancybox-close');
        } catch (e) {
            console.log('No popup found or unable to close');
        }

        console.log('Waiting for products to load...');
        await page.waitForSelector('.grid.grid--uniform.grid--view-items', { timeout: 30000 });

        const products = await page.evaluate(() => {
            const items = document.querySelectorAll('.grid.grid--uniform.grid--view-items .grid__item');
            return Array.from(items).map(item => {
                const titleElement = item.querySelector('.grid-view-item__title');
                const priceElement = item.querySelector('.price-item.price-item--regular');
                const imageElement = item.querySelector('.grid-view-item__image');
                
                return {
                    title: titleElement ? titleElement.textContent.trim() : '',
                    price: priceElement ? priceElement.textContent.trim() : '',
                    image: imageElement ? imageElement.src : '',
                    vendor: 'Candyville'
                };
            });
        });

        console.log(`Found ${products.length} products on Candyville`);
        return products;

    } catch (error) {
        console.error('Error scraping Candyville:', error);
        // Take a screenshot and save HTML if there's an error
        try {
            await page.screenshot({ path: 'error-candyville.png', fullPage: true });
            const html = await page.content();
            require('fs').writeFileSync('error-candyville.html', html);
            console.log('Debug files saved: error-candyville.png and error-candyville.html');
        } catch (e) {
            console.error('Error saving debug files:', e);
        }
        return [];
    } finally {
        await page.close();
    }
} */

/* async function autoScroll(page) {
    console.log('Starting auto-scroll...');
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.documentElement.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
    console.log('Finished auto-scroll');
} */

/* async function scrapeVendor2Products(browser) {
    // Similar implementation for Vendor 2
    // Adjust selectors based on Vendor 2's website structure
} */

/* async function findMatchingProducts(vendor1Products, vendor2Products) {
    const matches = [];
    
    for (const v1Product of vendor1Products) {
        // Use fuzzy matching for product names
        const v2Product = vendor2Products.find(v2 => {
            const similarity = calculateSimilarity(v1Product.name, v2.name);
            return similarity > 0.8; // 80% similarity threshold
        });
        
        if (v2Product) {
            matches.push({
                name: v1Product.name,
                vendor1Url: v1Product.url,
                vendor2Url: v2Product.url,
                vendor1Price: v1Product.price,
                vendor2Price: v2Product.price,
                imageUrl: v1Product.imageUrl
            });
        }
    }
    
    return matches;
} */

/* function calculateSimilarity(str1, str2) {
    // Simple string similarity implementation
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    const words1 = new Set(s1.split(/\W+/));
    const words2 = new Set(s2.split(/\W+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
} */

// Update the product scraping logic
/* async function scrapeCandyville() {
  console.log("Starting to scrape Candyville.ca...");
  console.log("Navigating to Candyville.ca shop page...");
  
  const products = [];
  
  try {
    // Look for product cards with class 'grid__item'
    const productElements = document.querySelectorAll('.grid__item');
    
    productElements.forEach(element => {
      // Extract product info
      const titleElement = element.querySelector('.product-title');
      const priceElement = element.querySelector('.product-price');
      const imageElement = element.querySelector('img');
      
      if (titleElement && priceElement) {
        const product = {
          title: titleElement.textContent.trim(),
          price: priceElement.textContent.trim().replace(/[^0-9.]/g, ''),
          image: imageElement ? imageElement.src : '',
          vendor: 'Candyville'
        };
        products.push(product);
      }
    });

    console.log(`Found ${products.length} products`);
    return products;

  } catch (error) {
    console.error("Error scraping Candyville:", error);
    return [];
  }
} */

router.post('/update-sequence', async (req, res) => {
  try {
    const { products } = req.body;
    
    // Update each product's sequence in the database
    const updatePromises = products.map((product, index) => {
      return Product.findByIdAndUpdate(
        product._id,
        { $set: { sequence: index } },
        { new: true }
      );
    });
    
    await Promise.all(updatePromises);
    
    // Fetch and return the updated products
    const updatedProducts = await Product.find().sort({ sequence: 1 });
    res.json(updatedProducts);
  } catch (error) {
    console.error('Error updating sequence:', error);
    res.status(500).json({ message: 'Error updating sequence' });
  }
});

// Add the scrape endpoint
router.post('/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    console.log('Scraping URL:', url);

    // Extract domain from URL
    const domain = new URL(url).hostname;
    console.log('Domain:', domain);

    // Make request to the URL
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    let price = '';
    let imageUrl = '';

    // Different scraping logic based on domain
    if (domain.includes('candyville.ca')) {
      // Update selectors based on actual HTML structure
      price = $('.price .money').first().text().trim().replace(/[^0-9.]/g, '');
      imageUrl = $('.product__media img').first().attr('src');
      if (imageUrl && imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      }
      console.log('Candyville price:', price, 'image:', imageUrl);
    } else if (domain.includes('candynow.ca')) {
      // Update selectors based on actual HTML structure
      price = $('.price-item--regular').first().text().trim().replace(/[^0-9.]/g, '');
      imageUrl = $('.product__media-item img').first().attr('src');
      if (imageUrl && imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      }
      console.log('Candynow price:', price, 'image:', imageUrl);
    }

    // Send back the scraped data
    const result = {
      price: parseFloat(price) || 0,
      domain,
      imageUrl: imageUrl || ''
    };
    console.log('Sending back:', result);
    res.json(result);

  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      message: 'Error scraping URL', 
      error: error.message,
      url: req.body.url 
    });
  }
});

module.exports = router; 