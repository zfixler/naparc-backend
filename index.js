const express = require('express');
// Import dotenv for development
require('dotenv').config();
// Import scrapers
const { scrapeRpcna } = require('./scrapers/rpcna');
const { scrapeArp } = require('./scrapers/arp');
const { scrapeFrcna } = require('./scrapers/frcna');
const { scrapeHrc } = require('./scrapers/hrc');
const { scrapeOpc } = require('./scrapers/opc');
const { scrapePca } = require('./scrapers/pca');
const { scrapePrc } = require('./scrapers/prc');
const { scrapeUrcna } = require('./scrapers/urcna');

// Create server
const app = express();
const port = process.env.PORT || 3000;

app.post('/', async (req, res) => {
	// Parse auth bearer from request
	const ACTION_KEY = req.headers.authorization.split(' ')[1];

	try {
		// Check if auth bearer matches secret key
		if (ACTION_KEY === process.env.APP_KEY) {
			// Run scrapers
			await scrapeOpc().catch((e) => console.log(e));
			await scrapeRpcna().catch((e) => console.log(e));
			await scrapeArp().catch((e) => console.log(e));
			await scrapeFrcna().catch((e) => console.log(e));
			await scrapeHrc().catch((e) => console.log(e));
			await scrapePca().catch((e) => console.log(e));
			await scrapePrc().catch((e) => console.log(e));
			await scrapeUrcna().catch((e) => console.log(e));
			res.status(200).json({ message: 'Scrape Complete' }).end();
		} else {
			res.status(401).end();
		}
	} catch (err) {
		res.status(500).end();
	}
});

app.listen(port, () => {
	console.log(`NAPARC backend listening on port ${port}`);
});
