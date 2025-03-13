const puppeteer = require('puppeteer');

async function scrapePrice(url) {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
        });
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);
        await page.goto(url, { waitUntil: 'networkidle0' });

        // Look for the meta tag with property="og:price:amount"
        const price = await page.evaluate(() => {
            const metaTag = document.querySelector('meta[property="og:price:amount"]');
            if (metaTag) {
                const price = parseFloat(metaTag.getAttribute('content'));
                return price;
            }
            return null;
        });

        return price;
    } catch (error) {
        console.error('Error scraping price:', error);
        return null;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

module.exports = {
    scrapePrice
}; 