require('dotenv').config()
const express = require('express')
const { scrapeRpcna } = require('./scrapers/rpcna')

const app = express()
const port = process.env.PORT || 3000

app.post('/', async (req, res) => {
  const { APP_KEY } = process.env;
  const ACTION_KEY  = req.headers.authorization.split(" ")[1];
  console.log(req.headers.authorization.split(" "), ACTION_KEY)
try {
  if(ACTION_KEY === APP_KEY){
    await scrapeRpcna().catch(e => console.log(e))
    res.status(200).json({ message: 'Scrape Complete' }).end();
  } else {
    res.status(401).end()
  }
} catch(err){
  res.status(500).end()
}
})

app.listen(port, () => {
  console.log(`NAPARC backend listening on port ${port}`)
})