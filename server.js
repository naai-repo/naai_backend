const express = require('express')
const {MongoClient} = require('mongodb');
// const url = 'mongodb://localhost:27017?directConnection=true';
const url = 'mongodb://0.0.0.0:27017';
const dbName = 'Naai'
const client = new MongoClient(url);
const app = express()
const port = 3000



async function getData(){

    let res = await client.connect();
    db=res.db(dbName)
    collection = db.collection('users')
    let data  = await collection.find({}).toArray();
    console.log('ew')
    console.log(data)
    return data;

}

getData()

app.get('/', async (req, res) => {
  let data = await getData();
  res.json(data)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})