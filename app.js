const express = require('express')
const mongoose = require('mongoose')
const passport = require('passport');
const session = require('express-session')
require('dotenv').config();
const app = express();
const PORT = 8800;
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rg1ncj1.mongodb.net/${process.env.DB_NAME}`;

// Requiring routers
// Admin Routes
const AdminRouter = require('./routes/adminRoutes/livePermissionRouter');
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
const LocationRouter = require('./routes/customerApp/locationRouter');

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
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))
app.use(passport.initialize());
app.use(passport.session());

// Admin Routes
app.use("/admin", AdminRouter);

// Partner App Routes
app.use("/partner/review", ReviewRouter);
app.use("/partner/salon", SalonRouter);
app.use("/partner/service", ServiceRouter);
app.use("/partner/artist", ArtistRouter);
app.use("/partner/booking", BookingRouter);
app.use("/partner/user", PartnerRouter);
app.use("/partner/otp", OtpRouter);


// Customer App Routes
app.use("/customer/user", UserRouter);
app.use("/customer/otp", UserOtpRouter);
app.use("/customer/user/location", LocationRouter);

app.get('/', async (req, res) => {
  res.sendFile(__dirname + '/index.html')
  // res.send("Welcome to backend");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
