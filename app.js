const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config();
const app = express();
const PORT = 8800;
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rg1ncj1.mongodb.net/${process.env.DB_NAME}`;

// Requiring routers
const ReviewRouter = require('./routes/reviewRouter');
const SalonRouter = require('./routes/salonRouter');
const ServiceRouter = require('./routes/serviceRouter');
const ArtistRouter = require('./routes/artistRouter');
const BookingRouter = require('./routes/bookingRouter');

//connecting to database

mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(()=>{
    console.log("Connected to Database!");
}).catch((err)=> {
    console.log(err);
})

// MiddleWares
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use("/review", ReviewRouter);
app.use("/salon", SalonRouter);
app.use("/service", ServiceRouter);
app.use("/artist", ArtistRouter);
app.use("/booking", BookingRouter);


app.get('/', async (req, res) => {
  res.send("Welcome to backend");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
