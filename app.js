const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config();
const app = express();
const PORT = 8800;
const url = `mongodb+srv://naaiadmn:naaiadmn@cluster0.rg1ncj1.mongodb.net/naai`;

// Requiring routers
// Partner App
const ReviewRouter = require('./routes/partnerApp/reviewRouter');
const SalonRouter = require('./routes/partnerApp/salonRouter');
const ServiceRouter = require('./routes/partnerApp/serviceRouter');
const ArtistRouter = require('./routes/partnerApp/artistRouter');
const BookingRouter = require('./routes/partnerApp/bookingRouter');
const PartnerRouter = require('./routes/partnerApp/partnerRouter')
const OtpRouter = require('./routes/partnerApp/otpRouter');

// Customer App
const UserRouter = require('./routes/customerApp/userRouter');
const UserOtpRouter = require('./routes/customerApp/otpRouter');

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

// Partner App Routes
app.use("/partner/review", ReviewRouter);
app.use("/partner/salon", SalonRouter);
app.use("/partner/service", ServiceRouter);
app.use("/partner/artist", ArtistRouter);
app.use("/partner/booking", BookingRouter);
app.use("/partner/partner", PartnerRouter);
app.use("/partner/otp", OtpRouter);


// Customer App Routes
app.use("/customer/user", UserRouter);
app.use("/customer/otp", UserOtpRouter);

app.get('/', async (req, res) => {
  res.send("Welcome to backend");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
