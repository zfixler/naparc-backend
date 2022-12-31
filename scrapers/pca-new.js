const axios = require('axios');
const db = require('../helpers/database');
const fs = require('fs');
const _ = require('lodash');

async function scrapePca() {
	try {
		const url =
			'https://static.batchgeo.com/map/json/fed353c376144b1fed2f5e29150c2531/1660213977';
		const data = await axios.get(url);
        console.log(data.data);


		// db.updateDb(cong).catch((error) => console.log(error));
	} catch (error) {
		console.log(error);
	}
}

scrapePca();
