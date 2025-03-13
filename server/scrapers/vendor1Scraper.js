const puppeteer = require('puppeteer');

async function scrapePrice(url) {
    let browser = null;
    try {
        console.log('Starting vendor1 price scraping for URL:', url);
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ]
        });
        console.log('Browser launched successfully');
        
        const page = await browser.newPage();
        console.log('New page created');
        
        // Set a user agent to avoid being blocked
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        await page.setDefaultNavigationTimeout(60000);
        console.log('Navigating to URL...');
        await page.goto(url, { waitUntil: 'networkidle0' });
        console.log('Page loaded successfully');

        // Wait for potential price elements to load
        await page.waitForTimeout(5000);

        // Try multiple selectors to find the price
        const price = await page.evaluate(() => {
            // Try meta tag first
            const metaTag = document.querySelector('meta[itemprop="price"]');
            if (metaTag) {
                const price = parseFloat(metaTag.getAttribute('content'));
                console.log('Price found in meta tag:', price);
                return price;
            }

            // Try price class
            const priceElement = document.querySelector('.price');
            if (priceElement) {
                const price = parseFloat(priceElement.textContent.replace(/[^0-9.]/g, ''));
                console.log('Price found in price class:', price);
                return price;
            }

            // Try product price class
            const productPrice = document.querySelector('.product__price');
            if (productPrice) {
                const price = parseFloat(productPrice.textContent.replace(/[^0-9.]/g, ''));
                console.log('Price found in product price class:', price);
                return price;
            }

            // Log the page content for debugging
            console.log('Page content:', document.body.innerHTML);
            return null;
        });

        console.log('Final price for vendor1:', price);
        return price;
    } catch (error) {
        console.error('Detailed error in vendor1 scraping:', error);
        console.error('Error stack:', error.stack);
        return null;
    } finally {
        if (browser) {
            await browser.close();
            console.log('Browser closed');
        }
    }
}

module.exports = {
    scrapePrice
}; 