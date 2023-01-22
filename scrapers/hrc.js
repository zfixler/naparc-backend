const cheerio = require('cheerio');
const axios = require('axios');

let id = 0;

function scrapeData(html) {
	const $ = cheerio.load(html);

	const main = $('main');

	const churchArray = [];

	main.find('article').each(async (i, el) => {
		const name = $(el)
			.children()
			.first()
			.children()
			.last()
			.children()
			.first()
			.html()
			.trim()
			.replace(/\,.*/, '');
		const address = $(el)
			.children()
			.first()
			.children()
			.last()
			.children()
			.first()
			.html()
			.trim()
			.replace(/([^,]+)/, '')
			.replace(/(?:\s,)/, '')
			.replace(/(?:,)/, '')
			.trim();

		const phone = $(el)
			.children()
			.first()
			.children()
			.last()
			.children()
			.first()
			.next()
			.text()
			.trim();

		const email = $(el)
			.children()
			.first()
			.children()
			.last()
			.children()
			.first()
			.next()
			.next()
			.children()
			.text()
			.trim();

		const website = $(el)
			.children()
			.last()
			.children()
			.children()
			.first()
			.children()
			.attr('href');

		const cong = {
			key: `hrc-${id}`,
			denom: 'HRC',
			name: name,
			address: address,
			phone: phone,
			email: email,
			website: website,
			location: {
				type: 'Point',
				coordinates: [null, null],
			},
		};

		id++;

		churchArray.push(cong);
	});

	return churchArray;
}

async function fetchData() {
	const data = await axios.get('https://heritagereformed.com/locations/');
	const html = await data.data;
	const congArray = await scrapeData(html);

	return congArray;
}

async function scrapeHrc() {
	const data = await fetchData().catch((error) => console.log(error));
	const results = [];

	for await (let item of data) {
		if (item.address.match(/[A-Z][0-9][A-Z]/g)) {
			const zip = item.address
				.match(/[A-Z]\d[A-Z]/g)
				.join()
				.trim();

			const url = `http://api.zippopotam.us/CA/${zip}`;

			const res = await axios.get(url);
			const json = await res.data;

			const lat = await json.places[0].latitude;
			const long = await json.places[0].longitude;

			item.location.coordinates[1] = parseFloat(lat);
			item.location.coordinates[0] = parseFloat(long);
		} else if (item.address.match(/\d{5}(?!.*\d{5})/g)) {
			const zip = item.address
				.match(/\d{5}(?!.*\d{5})/g)
				.join()
				.replace(/.*,/g, '')
				.trim();

			const url = `http://api.zippopotam.us/us/${zip}`;

			const res = await axios.get(url);
			const json = await res.data;

			const lat = await json.places[0].latitude;
			const long = await json.places[0].longitude;

			item.location.coordinates[1] = parseFloat(lat);
			item.location.coordinates[0] = parseFloat(long);
		}

		if (
			typeof item.location.coordinates[0] === 'number' &&
			isNaN(item.location.coordinates[0]) === false
		) {
			results.push(item);
		}

		return { results: results };
	}
}

exports.scrapeHrc = scrapeHrc;
