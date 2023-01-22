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
			let results = [];

			const { results: opc } = await runScrape().catch((e) => console.log(e));
			if (opc) [...results, ...opc];

			const { results: rpcna } = await scrapeRpcna().catch((e) => console.log(e));
			if (rpcna) [...results, ...rpcna];

			const { results: arp } = await scrapeArp().catch((e) => console.log(e));
			if (arp) [...results, ...arp];

			const { results: frcna } = await scrapeFrcna().catch((e) => console.log(e));
			if (frcna) [...results, ...frcna];

			const { results: hrc } = await scrapeHrc().catch((e) => console.log(e));
			if (hrc) [...results, ...hrc];

			const { results: pca } = await scrapePca().catch((e) => console.log(e));
			if (pca) [...results, ...pca];

			const { results: urcna } = await scrapeUrcna().catch((e) => console.log(e));
			if (urcna) [...results, ...urcna];

			const { results: rcus } = await scrapeRcus().catch((e) => console.log(e));
			if (rcus) [...results, ...rcus];
			
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
