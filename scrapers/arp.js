const axios = require('axios');
const db = require('../helpers/database');

let key = 0;

async function fetchArpData() {
	const arpData = [];

	const coordinates = [
		{ lat: 52.04382, long: -116.89581 },
		{ lat: 40.8364, long: -116.72003 },
		{ lat: 33.27284, long: -108.10675 },
		{ lat: 45.31444, long: -99.55389 },
		{ lat: 33.25814, long: -95.07147 },
		{ lat: 43.36607, long: -84.08514 },
		{ lat: 33.62485, long: -79.33905 },
		{ lat: 45.43175, long: -68.73449 },
		{ lat: 52.29718, long: -83.58801 },
		{ lat: 55.70432, long: -100.72668 },
		{ lat: 57.352124, long: -119.53528 },
	];

	for await (const coordinate of coordinates) {
		const url = `http://arpchurch.org/wp-admin/admin-ajax.php?action=store_search&lat=${coordinate.lat}&lng=${coordinate.long}&max_results=100&search_radius=500`;
		const res = await axios.get(url);
		const data = await res.data;
		arpData.push(data);
	}

	return arpData.flat();
}

async function scrapeArp() {
	const data = await fetchArpData().catch((error) => console.log(error));

	data.forEach((obj) => {
		const cong = {
			key: `arp-${key}`,
			name: obj.store,
			pastor: obj.fax,
			address: `${obj.address}, ${obj.city}, ${obj.state} ${obj.zip}`,
			phone: obj.phone,
			website: obj.url,
			email: obj.email,
			denom: 'ARP',
			location: {
				type: 'Point',
				coordinates: [parseFloat(obj.lng), parseFloat(obj.lat)],
			},
		};

		key++;

		if (typeof cong.location.coordinates[0] === 'number' && isNaN(cong.location.coordinates[0]) === false) {
			db.updateDb(cong).catch((error) => console.log(error));
		}
	});
}

exports.scrapeArp = scrapeArp;
