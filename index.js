require('dotenv').config()
const express = require('express')
const { scrapeRpcna } = require('./scrapers/rpcna')

const app = express()
const port = 3000

app.get('/', (req, res) => {
  scrapeRpcna().catch(e => console.log(e))
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})