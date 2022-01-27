const cheerio = require('cheerio');
const axios = require('axios');
const db = require('../helpers/database');

let id = 0;
let count = 0;
const pca = [];
const usa = [
	'AL',
	'AK',
	'AZ',
	'AR',
	'CA',
	'CO',
	'CT',
	'DE',
	'DC',
	'FL',
	'GA',
	'HI',
	'ID',
	'IL',
	'IN',
	'IA',
	'KS',
	'KY',
	'LA',
	'ME',
	'MD',
	'MA',
	'MI',
	'MN',
	'MS',
	'MO',
	'MT',
	'NE',
	'NV',
	'NH',
	'NJ',
	'NM',
	'NY',
	'NC',
	'ND',
	'OH',
	'OK',
	'OR',
	'PA',
	'RI',
	'SC',
	'SD',
	'TN',
	'TX',
	'UT',
	'VT',
	'VA',
	'WA',
	'WV',
	'WI',
	'WY',
];

async function getUsLongLat(city, state) {
	if (city === undefined || state === undefined) {
		return [null, null];
	} else {
		let name = null;

		if (city.includes('.')) {
			name = city.replace(/.*\.\s/g, '');
		} else {
			name = city.replace(/\s.*/g, '');
		}

		const res = await axios.get(`http://api.zippopotam.us/us/${state}/${name}`);
		const json = await res.data;

		let lat = null;
		let long = null;

		if (json.places !== undefined) {
			const location = json.places.filter(
				(ln) => ln['place name'].toLowerCase() === city
			);

			if (location[0] === undefined) {
				lat = json.places[0].latitude;
				long = json.places[0].longitude;
			} else {
				lat = location[0].latitude;
				long = location[0].longitude;
			}
		}

		return [lat, long];
	}
}

async function getCaLongLat(city, state) {
	let name = null;

	if (city.includes('.')) {
		name = city.replace(/.*\.\s/g, '');
	} else {
		name = city.replace(/\s.*/g, '');
	}

	const res = await axios.get(`http://api.zippopotam.us/ca/${state}/${name}`);
	const json = await res.data;

	let lat = null;
	let long = null;

	if (json.places !== undefined) {
		const location = json.places.filter(
			(ln) => ln['place name'].toLowerCase() === city
		);

		if (location[0] === undefined) {
			lat = json.places[0].latitude;
			long = json.places[0].longitude;
		} else {
			lat = location[0].latitude;
			long = location[0].longitude;
		}
	}

	return [lat, long];
}

async function scrapePage(html) {
	const $ = cheerio.load(html);

	$('.formtableleft').each((i, el) => {
		const name = $(el).children().text();
		const phone = $(el).siblings().first().next().next().next().next().text();
		const website = $(el)
			.siblings()
			.first()
			.next()
			.next()
			.next()
			.next()
			.next()
			.next()
			.children()
			.text();
		const email = $(el)
			.siblings()
			.first()
			.next()
			.next()
			.next()
			.next()
			.next()
			.children()
			.text();
		const pastor = $(el).siblings().last().text();

		const city = $(el).next().text();
		const state = $(el).next().next().text();

		const cong = {
			key: `pca-${id}`,
			name: name,
			phone: phone,
			pastor: pastor,
			email: email,
			website: website ? `http://${website}` : '',
			address: `${city}, ${state}`,
			city: city.toLowerCase(),
			state: state.toLowerCase(),
			denom: 'PCA',
		};

		id++;
		pca.push(cong);
	});
}

async function getStateOptions() {
	const page = await axios.get(
		'https://stat.pcanet.org/ac/directory/directory.cfm'
	);
	const html = await page.data;

	const $ = cheerio.load(html);

	const stateSelectorArray = [];

	$('#State')
		.children()
		.each((i, el) => {
			stateSelectorArray.push($(el).attr('value'));
		});
	count = stateSelectorArray.length;
	return stateSelectorArray;
}

async function fetchPage(url, data) {
	const page = await axios.post(url, data, {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
	});

	return await page.data;
}

async function scrapePca() {
	const states = await getStateOptions().catch((error) => console.log(error));

	for await (const state of states) {
		if (state !== 'Select State' && state !== '-') {
			const data = `State=${state}&orderby=1`;
			const url = 'https://stat.pcanet.org/ac/directory/directory.cfm';
			const html = await fetchPage(url, data).catch((error) => {
				if (error.code === 'ECONNRESET') {
					fetchPage(url, data).catch((error) => console.log(error));
				} else {
					console.log(error);
				}
			});
			if (typeof html === 'string') {
				scrapePage(html).catch((error) => console.log(error));
			}
		}
	}

	for await (const cong of pca) {
		if (usa.includes(cong.state.toUpperCase())) {
			const locArr = await getUsLongLat(cong.city, cong.state).catch(
				(error) => {
					if (error.code === 'ECONNRESET') {
						getUsLongLat(cong.city, cong.state).catch((error) =>
							console.log(error)
						);
					} else {
						console.log(error);
					}
				}
			);
			if (locArr !== undefined) {
				cong.lat = locArr[0];
				cong.long = locArr[1];
			}
		} else {
			const locArr = await getCaLongLat(cong.city, cong.state).catch(
				(error) => {
					if (error.code === 'ECONNRESET') {
						getCaLongLat(cong.city, cong.state).catch((error) =>
							console.log(error)
						);
					} else {
						console.log(error);
					}
				}
			);
			if (locArr !== undefined) {
				cong.lat = locArr[0];
				cong.long = locArr[1];
			}
			console.log(cong);
		}

		if (cong.lat !== undefined) {
			db.updateDb(cong).catch((error) => console.log(error));
		}

		count++;

		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write(`Total hits: ${count}.`);
	}
}

exports.scrapePca = scrapePca;
