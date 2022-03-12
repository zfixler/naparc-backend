const cheerio = require('cheerio');
const axios = require('axios');
const db = require('../helpers/database');

let totalUrls = null;
let id = 0;

function getUrls(html) {
	const $ = cheerio.load(html);
	const table = $('#myList');
	const congUrl = [];

	table
		.children()
		.last()
		.children()
		.each((i, el) => {
			const url = $(el).children().first().find('a').attr('href');
			congUrl.push(url);
		});

	return congUrl;
}

function scrapeCong(url) {
	const decoded = decodeURIComponent(url);
	const congArr = decoded.split('&');

	const name = congArr
		.find((str) => str.includes('church'))
		.replace(/.*=/g, '');
	const pastor = congArr
		.find((str) => str.includes('min1'))
		.replace(/.*=/g, '');
	const addr = congArr.find((str) => str.includes('addr')).replace(/.*=/g, '');
	const city = congArr.find((str) => str.includes('city')).replace(/.*=/g, '');
	const state = congArr
		.find((str) => str.includes('state'))
		.replace(/.*=/g, '');
	const zip = congArr.find((str) => str.includes('zip')).replace(/.*=/g, '');
	const address = `${addr} ${city}, ${state} ${zip}`;
	const phone = congArr
		.find((str) => str.includes('phone'))
		.replace(/.*=/g, '');
	const email = congArr
		.find((str) => str.includes('email'))
		.replace(/.*=/g, '');
	let website = congArr.find((str) => str.includes('web')).replace(/.*=/g, '');

	if (website === 'www.gracealto.com') {
		website = 'www.graceurcmi.com';
	}

	const long = congArr.find((str) => str.includes('lng')).replace(/.*=/g, '');
	const lat = congArr.find((str) => str.includes('lat')).replace(/.*=/g, '');

	cong = {
		key: `urcna-${id}`,
		name: name,
		denom: 'URCNA',
		address: address,
		pastor: pastor,
		phone: phone,
		email: email,
		website: `http://${website}`,
		location: {
			type: 'Point',
			coordinates: [parseFloat(long), parseFloat(lat)],
		},
	};

	id++;

	return cong;
}

async function scrapeUrcna() {
	try {
		const page = await axios.get(
			'https://www.urcna.org/sysfiles/member/family/urcna_report.cfm?memberid=1651&public=1'
		);
		const html = await page.data;
		const scraped = getUrls(html);
		totalUrls = scraped.length;

		scraped.forEach((url) => {
			const cong = scrapeCong(url);

			if (typeof cong.location.coordinates[0] === 'number' && isNaN(cong.location.coordinates[0]) === false) {
				db.updateDb(cong).catch((error) => console.log(error));
			}
		});
	} catch {
		(error) => console.log(error);
	}
}
scrapeUrcna()
exports.scrapeUrcna = scrapeUrcna;
