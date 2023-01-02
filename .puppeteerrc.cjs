const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
	// Changes the cache location for Puppeteer.
	   cacheDirectory: join(__dirname, 'project/src/', '.cache', 'puppeteer'),
	// cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
