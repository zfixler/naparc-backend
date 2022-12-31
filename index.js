const express = require('express');
// Import Db for Indexing
const db = require('./helpers/database');
// Import dotenv for development
require('dotenv').config();
// Import scrapers
const { scrapeRpcna } = require('./scrapers/rpcna');
const { scrapeArp } = require('./scrapers/arp');
const { scrapeFrcna } = require('./scrapers/frcna');
const { scrapeHrc } = require('./scrapers/hrc');
const { scrapePca } = require('./scrapers/pca');
const { scrapeUrcna } = require('./scrapers/urcna');
const { scrapeRcus } = require('./scrapers/rcus');
const runScrape = require('./scrapers/runScrape');

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
			const { results: opc } = await runScrape().catch((e) => console.log(e));
			const { results: rpcna } = await scrapeRpcna().catch((e) => console.log(e));
			const { results: arp } = await scrapeArp().catch((e) => console.log(e));
			const { results: frcna } = await scrapeFrcna().catch((e) => console.log(e));
			const { results: hrc } = await scrapeHrc().catch((e) => console.log(e));
			const { results: pca } = await scrapePca().catch((e) => console.log(e));
			const { results: urcna } = await scrapeUrcna().catch((e) => console.log(e));
			const { results: rcus } = await scrapeRcus().catch((e) => console.log(e));
			const results = [...opc, ...rpcna, ...arp, ...frcna, ...hrc, ...pca, ...urcna, ...rcus];
			await db.updateDb(results).catch(e => console.log(e));
			res.status(200).json({ message: 'Scrape Complete' }).end();
		} else {
			res.status(401).end();
		}
	} catch (err) {
		console.log(err);
		res.status(500).end();
	}
});

app.listen(port, () => {
	console.log(`NAPARC backend listening on port ${port}`);
});
