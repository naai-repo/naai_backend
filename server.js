const express = require('express')
const mongoose = require('mongoose')
const {MongoClient} = require('mongodb');
 const Review = require('./model/Review')
// const url = 'mongodb://localhost:27017?directConnection=true';
const url = 'mongodb://0.0.0.0:27017/?directConnection=true';
const dbName = 'Naai'
const client = new MongoClient(url);
const app = express()
const port = 3000

const newExample = new Review({
  title: 'John Doe', 
  userId: new mongoose.Types.ObjectId(),
   saloonId: new mongoose.Types.ObjectId(),
   artistId :new mongoose.Types.ObjectId(),
});


newExample.save()
  .then(result => {
    console.log('Document saved:', result);
  })
  .catch(err => {
    console.error(err);
  });



async function getData(){

    let res = await client.connect();
    db=res.db(dbName)
    collection = db.collection('users')
    let data  = await collection.find({}).toArray();
    console.log('ew')
    console.log(data)
    return data;

}
async function getArtists(){

    let res = await client.connect();
    db=res.db(dbName)
    collection = db.collection('artist')
    let data  = await collection.find({}).toArray();
    console.log(data)
    return data;

}

getData()

app.get('/', async (req, res) => {
  let data = await getData();
  res.json(data)
})
app.get('/createUser', async (req, res) => {
  let data = await getData();
  res.json(data)
})

app.get('/v1/getArtists', async (req, res) => {
  let data = await getArtists();
  res.json(data)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
