const opcScraper = require('../scrapers/opc-puppeteer');

async function scrapeAll(browserInstance) {
	let browser;
	try {
		browser = await browserInstance;
		const { results } = await opcScraper.scraper(browser);
		browser.close();
		console.log('Browser closed....');
		return { results };
	} catch (err) {
		console.log('Could not resolve the browser instance => ', err);
		browser.close();
	}
}

module.exports = (browserInstance) => scrapeAll(browserInstance);
