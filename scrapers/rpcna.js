const cheerio = require('cheerio');
const axios = require('axios');
const db = require('../helpers/database');

let id = 0;

function presbyteries(html) {
	const $ = cheerio.load(html);
	const urls = [];

	$('ul')
		.children()
		.each((i, el) => {
			let url = $(el).children().attr('href');
			if (url !== undefined && url.includes('category')) {
				urls.push(url);
			}
		});

	return urls;
}

function congregations(html) {
	const $ = cheerio.load(html);
	const urls = [];
	$('tbody')
		.children()
		.each((i, el) => {
			const url = $(el).find('a').attr('href');
			if (url !== undefined && !url.includes('@')) {
				urls.push(url);
			}
		});
	return urls;
}

async function scrapeCong(url) {
	const resp = await axios.get(url);
	const $ = cheerio.load(resp.data);

	let phone = '';
	let email = '';
	let website = '';
	let pastor = '';

	$('.church_info')
		.find('th')
		.each((i, el) => {
			const content = $(el).text();
			if (content.includes('Phone')) {
				phone = $(el).next().text().trim();
			} else if (content.includes('Email')) {
				email = $(el).next().children().text().trim();
			} else if (content.includes('Web')) {
				website = $(el).next().children().attr('href');
			}
		});

	$('.church_info')
		.find('p')
		.each((i, el) => {
			if ($(el).text().includes('Pastor')) {
				pastor = $(el).text().replace(/,.*/g, '').trim();
			} else if ($(el).text().includes('Contact')) {
				pastor = $(el).text().trim();
			}
		});

	const address = $('[name=daddr]')
		.attr('value')
		.replace(/<br\s*\/?>/gi, ' ')
		.replace(/\s\s+/g, ' ')
		.replace(/.\s,/g, '.,')
		.trim();

	const name = $('.church_info').find('h1').html().replace(/\<.*/g, '').trim();

	const congregation = {
		key: `rpcna-${id}`,
		name: name,
		denom: 'RPCNA',
		phone: phone,
		email: email,
		website: website,
		pastor: pastor,
		address: address,
		location: {
			type: 'Point',
			coordinates: [null, null],
		},
	};

	if (address.match(/\d{5}(?!.*\d{5})/g) !== null) {
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

		congregation.location.coordinates[1] = parseFloat(lat);
		congregation.location.coordinates[0] = parseFloat(long);
	} else if (address.match(/[A-Z]\d[A-Z]/g) !== null) {
		const zip = address
			.match(/[A-Z]\d[A-Z](?!.*[A-Z]\d[A-Z])/g)
			.join()
			.replace(/.*,/g, '')
			.trim();

		const url = `http://api.zippopotam.us/CA/${zip}`;

		const res = await axios.get(url);
		const json = await res.data;

		const lat = await json.places[0].latitude;
		const long = await json.places[0].longitude;

		congregation.location.coordinates[1] = parseFloat(lat);
		congregation.location.coordinates[0] = parseFloat(long);
	}

	id++;

	if (typeof congregation.location.coordinates[0] === 'number' && isNaN(cong.location.coordinates[0]) === false) {
		db.updateDb(congregation).catch((error) => console.log(error));
	}
}

async function scrapeRpcna() {
	const response = await axios.get(
		'https://rpcna.org/trunk/page/congregations'
	);
	const presbyteryUrlList = presbyteries(response.data);

	const allUrls = [];

	for await (const presb of presbyteryUrlList) {
		const response = await axios.get(presb);
		const congUrls = congregations(response.data);
		allUrls.push(congUrls);
	}

	for await (const url of allUrls.flat()) {
		await scrapeCong(url).catch((error) => console.log(error));
	}
}

exports.scrapeRpcna = scrapeRpcna;
