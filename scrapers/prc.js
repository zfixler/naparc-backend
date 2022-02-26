//PRC Updated their website, making this scraper obsolete. Need to update.

const cheerio = require('cheerio');
const axios = require('axios');
const db = require('../helpers/database');

let id = 0;

async function scrapeCong(arr) {
	for (const url of arr) {
		const page = await axios.get(url);
		const html = await page.data;
		const $ = cheerio.load(html);

		const name = $('header > h1').text();
		const textWidget = $('div.textwidget')
			.html()
			.replace(/\n/g, '')
			.split('<br>');

		const pastor = textWidget
			.filter((item) => item.includes('Pastor'))
			.toString()
			.replace(/\,.*/g, '')
			.replace(/Pastor:/, '')
			.trim();

		const addressIndex = textWidget.findIndex(
			(i) => i.includes('Address') || i.includes('Location')
		);

		const addressString = `${textWidget[addressIndex + 1]} ${
			textWidget[addressIndex + 2]
		} ${textWidget[addressIndex + 3]} ${textWidget[addressIndex + 4]}`;

		const address = addressString
			.replace(/\(.*/g, '')
			.replace(/Phone:/, '')
			.replace(/\s\s+/g, '')
			.trim();

		const phone = textWidget
			.filter((item) => item.includes('Phone'))
			.toString()
			.replace(/[^0-9()-\s]/gm, '')
			.trim();

		const linkArray = $('div.textwidget').text().replace(/\n/g, ' ').split(' ');

		const email = linkArray.filter((i) => i.includes('@')).toString();

		const cong = {
			key: `prc-${id}`,
			denom: 'PRC',
			name: name,
			pastor: pastor,
			address: address,
			phone: phone,
			email: email,
			website: url,
			location: {
				type: "Point",
				coordinate: [null, null]
			},
		};

		if (address.match(/[A-Z][0-9][A-Z]/g)) {
			const zip = address
				.match(/[A-Z]\d[A-Z]/g)
				.join()
				.trim();

			const url = `http://api.zippopotam.us/CA/${zip}`;

			const res = await axios.get(url);
			const json = await res.data;

			const lat = await json.places[0].latitude;
			const long = await json.places[0].longitude;

			cong.location.coordinate[1] = lat;
			cong.location.coordinate[0] = long;
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

			const lat = await json.places[0].latitude;
			const long = await json.places[0].longitude;

			cong.location.coordinate[1] = parseFloat(lat);
			cong.location.coordinate[0] = parseFloat(long);
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

				cong.location.coordinate[1] = parseFloat(lat);
				cong.location.coordinate[0] = parseFloat(long);
			}
		}

		id++;

		if (cong.location.coordinate[0] !== null) {
			console.log(cong)
			//db.updateDb(cong).catch((error) => console.log(error));
		}
	}
}

async function scrapePrc() {
	const page = await axios.get('https://presbyterianreformed.org/');
	const html = await page.data;
	const $ = cheerio.load(html);
	const urlArray = [];

	$('#menu-item-62')
		.children()
		.last()
		.children()
		.each((i, el) => {
			urlArray.push($(el).find('a').attr('href'));
		});

	await scrapeCong(urlArray);
}

scrapePrc()

exports.scrapePrc = scrapePrc;
