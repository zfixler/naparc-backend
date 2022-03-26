const axios = require('axios');
const cheerio = require('cheerio');
const db = require('../helpers/database');

async function scrapeRcus() {
	const url =
		'https://rcus.org/wp-json/wpgmza/v1/features/base64eJyrVkrLzClJLVKyUqqOUcpNLIjPTIlRsopRMoxR0gEJFGeUFni6FAPFomOBAsmlxSX5uW6ZqTkpELFapVoABU0Wug';
	const response = await axios.get(url);
	const json = response.data;
	let id = 0;
	json.markers.forEach((obj) => {
		const $ = cheerio.load(obj.description);
		const contact = $('.contact').toString();
		const cong = {
			key: `rcus-${id}`,
			name: obj.title,
			denom: 'RCUS',
			address: obj.address,
			pastor:
				contact &&
				contact
					.match(/Contact:\s\w+\s\w+/)[0]
					.replace(/Tel/, '')
					.trim(),
			phone: $('.phone').text().replace(/Tel: /, '').trim(),
			email: null,
			website: obj.link,
			location: {
				type: 'Point',
				coordinates: [parseFloat(obj.lng), parseFloat(obj.lat)],
			},
		};
		id++;

        if (typeof cong.location.coordinates[0] === 'number' && isNaN(cong.location.coordinates[0]) === false) {
			db.updateDb(cong).catch((error) => console.log(error));
		}
	});
}

exports.scrapeRcus = scrapeRcus;