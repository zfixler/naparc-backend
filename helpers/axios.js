const axios = require('axios');
const https = require('https');

axios.defaults.timeout = 60000;
axios.defaults.httpsAgent = new https.Agent({ keepAlive: true });