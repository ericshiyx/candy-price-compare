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
        
        await page.setDefaultNavigationTimeout(60000);
        console.log('Navigating to URL...');
        await page.goto(url, { waitUntil: 'networkidle0' });
        console.log('Page loaded successfully');

        // Look for the meta tag with itemprop="price"
        const price = await page.evaluate(() => {
            const metaTag = document.querySelector('meta[itemprop="price"]');
            console.log('Meta tag found:', metaTag);
            if (metaTag) {
                const price = parseFloat(metaTag.getAttribute('content'));
                console.log('Price extracted:', price);
                return price;
            }
            console.log('No price meta tag found');
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