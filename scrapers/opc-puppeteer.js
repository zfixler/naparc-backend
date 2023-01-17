const _ = require('lodash');

const opcScraper = {
	url: 'https://www.opc.org/locator.html',
	async scraper(browser) {
		async function scrapePage(page) {
			const churches = await page.$$eval('.churchCard', (card) =>
				card.map((table) => {
					const congregation = { denom: 'OPC' };
					const h4s = [...table.querySelectorAll('h4')];
					const h2 = table.querySelector('h2');
					if (h2) congregation.name = h2.innerText.split(' -')[0].trim();

					h4s.map((h4) => {
						const text = h4.innerText.toUpperCase();
						if (text.includes('CONTACT')) {
							const p = h4.nextElementSibling.innerHTML;
							congregation.phone = p.match(/Phone: (.*?)<br>/)
								? p.match(/Phone: (.*?)<br>/)[1].trim()
								: '';
							congregation.email = p.match(
								/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi
							)
								? p
										.match(
											/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi
										)[0]
										.trim()
								: '';
							const textArray = h4.nextElementSibling.textContent.split(':');
							congregation.pastor = textArray[0].includes('Pastor')
								? textArray[1].replace('Email', '').replace('Phone', '').trim()
								: '';
							congregation.contact = textArray[0].includes('Contact')
								? textArray[1].replace('Email', '').trim()
								: '';
						}
						if (text.includes('ADDRESS'))
							congregation.address = h4.nextElementSibling.innerHTML
								.replace('<br>', ' ')
								.trim();
					});

					const desktop = table.querySelector('.desktop');
					if (desktop)
						congregation.website =
							desktop.nextElementSibling.textContent.trim();

					return congregation;
				})
			);
			
			const map = await page.$$eval('div.ibfix', (mapCard) =>
				mapCard.map((card) => {
					const obj = {};
					const h5 = card.querySelector('h5');
					if (h5) obj.name = h5.innerText.toUpperCase().trim();
					const paragraphs = [...card.querySelectorAll('p')];
					const coordinates = paragraphs.reduce((memo, p) => {
						if (p.hasAttribute('style'))
							memo = p.innerText
								.match(/\((.*?)\)/)[1]
								.trim()
								.split(', ');
						return memo;
					}, '');

					obj.phone = paragraphs.reduce((memo, p) => {
						if (p.innerHTML.includes('Phone:')) memo = p.innerHTML.match(/Phone:(.*?)<br>/)[1].trim();
						return memo;
					}, '');

					if (coordinates)
						obj.location = {
							type: 'Point',
							coordinates: coordinates.map((str) => parseFloat(str)).reverse(),
						};

					return obj;
				})
			);
			
			

			return {
				results: _.values(
					_.merge(_.keyBy(churches, 'phone'), _.keyBy(map, 'phone'))
				),
			};
		}

		try {
			const opc = [];
			let selectOptions = [];

			let page = await browser.newPage();
			page.goto(this.url);
			await page.waitForSelector('select[name=presbytery_id]');

			selectOptions = await page.$$eval(
				'select[name=presbytery_id]',
				(select) => {
					const selectOptions = [];
					select.map((el) => {
						const options = [...el.querySelectorAll('option')];
						options.forEach((option) => selectOptions.push(option.value));
					});
					return selectOptions;
				}
			);

			for await (const option of selectOptions) {
				if (!!option) {
					await page.select('select[name=presbytery_id]', option);
					await Promise.all([
						await page.waitForSelector('select[name=presbytery_id]'),
						page.waitForNavigation({
							waitUntil: [
								'load',
								'domcontentloaded',
								'networkidle0',
								'networkidle2',
							],
						}),
						page.click('input[type="submit"]'),
					]);
					const { results } = await scrapePage(page).catch((e) =>
						console.log(e)
					);
					opc.push(results);
				}
			}

			return {
				results: _.map(opc.flat(), (cong, i) => {
					cong.key = `opc-${i}`;
					return cong;
				}) || [],
			};
		} catch (e) {
			console.log(e);
		}
	},
};

module.exports = opcScraper;
