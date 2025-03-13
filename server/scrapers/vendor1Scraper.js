const axios = require('axios');
const cheerio = require('cheerio');

async function scrapePrice(url) {
    try {
        console.log('Starting vendor1 price scraping for URL:', url);
        
        // Set headers to mimic a browser
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        };

        const response = await axios.get(url, { headers });
        console.log('Page fetched successfully');
        
        const $ = cheerio.load(response.data);
        
        // Try multiple selectors
        let price = null;
        
        // Try meta tag
        const metaPrice = $('meta[itemprop="price"]').attr('content');
        if (metaPrice) {
            price = parseFloat(metaPrice);
            console.log('Price found in meta tag:', price);
        }
        
        // Try price class
        if (!price) {
            const priceText = $('.price').text();
            if (priceText) {
                price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                console.log('Price found in price class:', price);
            }
        }
        
        // Try product price class
        if (!price) {
            const productPrice = $('.product__price').text();
            if (productPrice) {
                price = parseFloat(productPrice.replace(/[^0-9.]/g, ''));
                console.log('Price found in product price class:', price);
            }
        }
        
        // Try JSON-LD data
        if (!price) {
            const jsonLd = $('script[type="application/ld+json"]').html();
            if (jsonLd) {
                try {
                    const data = JSON.parse(jsonLd);
                    if (data.offers && data.offers.price) {
                        price = parseFloat(data.offers.price);
                        console.log('Price found in JSON-LD:', price);
                    }
                } catch (e) {
                    console.log('Error parsing JSON-LD:', e);
                }
            }
        }

        console.log('Final price for vendor1:', price);
        return price;
    } catch (error) {
        console.error('Detailed error in vendor1 scraping:', error);
        console.error('Error stack:', error.stack);
        return null;
    }
}

module.exports = {
    scrapePrice
}; 