const browserObject = require('../browser/browser');
const scraperController = require('../browser/controller');

async function runScrape() {
	//Start the browser and create a browser instance
	let browserInstance = browserObject.startBrowser();

	// Pass the browser instance to the scraper controller
	const { results } = await scraperController(browserInstance);
    
	return { results };
}

module.exports = runScrape;
