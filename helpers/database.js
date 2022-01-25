const { MongoClient } = require('mongodb');

async function updateDb(obj) {
    //MongoDB uri
	const uri = `mongodb+srv://zfixler:${process.env.MONGO_PASSWORD}@naparc.hnt60.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
	const client = new MongoClient(uri, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
    //Connect to Mongo Client
    await client.connect();
    const db = client.db('NAPARC');
    const collection = db.collection('congregations');
    //Add date to document
    obj.dateUpdated = new Date().toISOString();
    //Check for entry with matching key
    const query = {key: obj.key}
    //Update with new information
    const update = { $set: obj}
    //Create if new, update if existing
    const options = { upsert: true };
    await collection.updateOne(query, update, options).catch(e => console.log(e));
    client.close()
}

exports.updateDb = updateDb;