const cheerio = require('cheerio');
const axios = require('axios');
const db = require('../helpers/database');
const https = require('https');

let totalHits = 0;
let churchArray = [];
let totalRejects = 0;
let id = 0;

function writeJson(num1, num2, data) {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write(`Total hits: ${num1}. Total rejects: ${num2}.`);

	if (data !== null) {
		if(data.lat){
			db.updateDb(data).catch((error) => console.log(error));
		}
	}

	id++;
}

async function getURL(res) {
	const $ = cheerio.load(res);

	if ($('.churchCard').length === 1) {
		const card = $('.churchCard');

		const name = card
			.find('.churchdirhead')
			.first()
			.children()
			.text()
			.replace(/\-.*/g, '')
			.replace(/\s\s+/g, '')
			.trim();

		const address = card
			.find('p')
			.first()
			.html()
			.replace(/<br\s*\/?>/gi, ' ')
			.trim();

		const contact = card.find('h4').filter(function () {
			return $(this).text().trim() === 'Contact Information';
		});

		const pastor = contact
			.next()
			.html()
			.replace(/\<.*/g, '')
			.replace(/Pastor:/, '')
			.trim();

		const email = contact.next().find('a').text();

		const phone = contact
			.next()
			.html()
			.replace(/^(.*?)<\/a>/, '')
			.replace(/<br\s*\/?>/gi, ' ')
			.replace(/^(.*?):/, '')
			.trim();

		let website = card.find('a').last().attr('href');

		website.includes('/locator.html?presbytery_id')
			? (website = 'http://www.opc.org')
			: website;

		const congregation = {
			key: `opc-${id}`,
			denom: 'OPC',
			name: name,
			pastor: pastor,
			phone: phone,
			email: email,
			website: website,
			address: address,
		};

		if (address.match(/[A-Z][0-9][A-Z]/g)) {
			const zip = address
				.match(/[A-Z]\d[A-Z]/g)
				.join()
				.trim();

			const url = `http://api.zippopotam.us/CA/${zip}`;

			const res = await axios.get(url);
			const json = await res.data;

			if (json.places !== undefined) {
				const lat = await json.places[0].latitude;
				const long = await json.places[0].longitude;

				congregation.lat = lat;
				congregation.long = long;
			}
		} else if (
			address.match(/[A-Z][a-z]+,\s[A-Z]{2}[0-9]{5}/g) ||
			address.match(/[A-Z][a-z]+,\s[A-Z]{2}\s[0-9]{5}/g)
		) {
			const zip = address
				.match(/\d{5}(?!.*\d{5})/g)
				.join()
				.replace(/.*,/g, '')
				.trim();

			const url = `http://api.zippopotam.us/us/${zip}`;

			const res = await axios.get(url);
			const json = await res.data;

			if (json.places !== undefined) {
				const lat = await json.places[0].latitude;
				const long = await json.places[0].longitude;

				congregation.lat = lat;
				congregation.long = long;
			}
		} else if (address.match(/[A-Z][a-z]+,\s[A-Z]{2}/g)) {
			let str = address.match(/[A-Z][a-z]+,\s[A-Z]{2}/g)[0];
			let state = str.match(/[A-Z]{2}/g)[0];
			let town = str.match(/[A-Z][a-z]+/g)[0];

			const url = `http://api.zippopotam.us/us/${state}/${town}`;

			const res = await axios.get(url);
			const json = await res.data;

			if (json.places !== undefined) {
				const lat = await json.places[0].latitude;
				const long = await json.places[0].longitude;

				congregation.lat = lat;
				congregation.long = long;
			}
		}

		totalHits += 1;
		writeJson(totalHits, totalRejects, congregation);
	} else {
		totalRejects += 1;
		writeJson(totalHits, totalRejects, null);
	}
}

async function scrapeOpc() {
	const urlList = [];
	for (let i = 0; i < 550; i++) {
		urlList.push(`https://www.opc.org/church.html?church_id=${i}`);
	}

	const httpsAgent = new https.Agent({
		rejectUnauthorized: false,
	});

	for await (const url of urlList) {
		const page = await axios
			.get(url, {
				method: 'GET',
				redirect: 'manual',
				agent: httpsAgent,
			})
			.catch((error) => console.log(error));

		if (page !== undefined) {
			const html = await page.data;
			const cong = await getURL(html);
			if (cong !== undefined) {
				churchArray.push(cong);
			}
		}
	}
}

exports.scrapeOpc = scrapeOpc;
