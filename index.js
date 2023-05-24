const express = require('express');
// Set axios defaults
require('./helpers/axios');
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

			const opc = await runScrape().catch((e) => console.log(e));
			if (opc) {
				results = [...results, ...opc.results];
				console.log(`OPC scraper returned ${ opc.results.length } results.`)
			} else {
				console.log('OPC scraper failed.')
			}

			const rpcna = await scrapeRpcna().catch((e) => console.log(e));
			if (rpcna) {
				results = [...results, ...rpcna.results];
				console.log(`RPCNA scraper returned ${ rpcna.results.length } results.`)
			} else {
				console.log('RPCNA scraper failed.')
			}

			const arp = await scrapeArp().catch((e) => console.log(e));
			if (arp) {
				results = [...results, ...arp.results];
				console.log(`ARP scraper returned ${ arp.results.length } results.`)
			} else {
				console.log('ARP scraper failed.')
			}

			const frcna = await scrapeFrcna().catch((e) => console.log(e));
			if (frcna) {
				results = [...results, ...frcna.results];
				console.log(`FRCNA scraper returned ${ frcna.results.length } results.`)
			} else {
				console.log('FRCNA scraper failed.')
			}

			const hrc = await scrapeHrc().catch((e) => console.log(e));
			if (hrc) {
				results = [...results, ...hrc.results];
				console.log(`HRC scraper returned ${ hrc.results.length } results.`)
			} else {
				console.log('HRC scraper failed.')
			}

			const pca = await scrapePca().catch((e) => console.log(e));
			if (pca) {
				results = [...results, ...pca.results];
				console.log(`PCA scraper returned ${ pca.results.length } results.`)
			} else {
				console.log('PCA scraper failed.')
			}

			const urcna = await scrapeUrcna().catch((e) => console.log(e));
			if (urcna) {
				results = [...results, ...urcna.results];
				console.log(`URCNA scraper returned ${ urcna.results.length } results.`)
			} else {
				console.log('URCNA scraper failed.')
			}

			const rcus = await scrapeRcus().catch((e) => console.log(e));
			if (rcus) {
				results = [...results, ...rcus.results];
				console.log(`RCUS scraper returned ${ rcus.results.length } results.`)
			} else {
				console.log('RCUS scraper failed.')
			}
			
			console.log(`All scrapers completed with ${ results.length } results...`);
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
