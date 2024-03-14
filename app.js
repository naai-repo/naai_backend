const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
require("dotenv").config();
const app = express();
const PORT = 8800;
const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rg1ncj1.mongodb.net/${process.env.DB_NAME}`;

// Requiring routers
// Admin Routes
const AdminRouter = require("./routes/adminRoutes/livePermissionRouter");
// Image Routes
const ImageRouter = require("./routes/imageRoutes/imageRouter");
// Partner App
const ReviewRouter = require("./routes/partnerApp/reviewRouter");
const SalonRouter = require("./routes/partnerApp/salonRouter");
const ServiceRouter = require("./routes/partnerApp/serviceRouter");
const ArtistRouter = require("./routes/partnerApp/artistRouter");
const PartnerRouter = require("./routes/partnerApp/partnerRouter");
const OtpRouter = require("./routes/partnerApp/otpRouter");
const InventoryRouter = require("./routes/partnerApp/inventoryRouter");
const PlanRouter = require("./routes/partnerApp/planRouter");

// Customer App
const UserRouter = require("./routes/customerApp/userRouter");
const UserOtpRouter = require("./routes/customerApp/otpRouter");
const LocationRouter = require("./routes/customerApp/locationRouter");

// Booking Appointment
const SchedulingRouter = require("./routes/bookingRoutes/schedulingRoutes");
const { testing } = require("./helper/scheduler");

// MiddleWares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Admin Routes
app.use("/admin", AdminRouter);

// Image Routes
app.use("/image", ImageRouter);

// Partner App Routes
app.use("/partner/review", ReviewRouter);
app.use("/partner/salon", SalonRouter);
app.use("/partner/service", ServiceRouter);
app.use("/partner/artist", ArtistRouter);
app.use("/partner/user", PartnerRouter);
app.use("/partner/otp", OtpRouter);
app.use("/partner/inventory", InventoryRouter);

// Customer App Routes
app.use("/customer/user", UserRouter);
app.use("/customer/otp", UserOtpRouter);
app.use("/customer/user/location", LocationRouter);
app.use("/customer/plan", PlanRouter);

// Scheduling Appointments
app.use("/appointments", SchedulingRouter);

app.get("/", async (req, res) => {
  res.sendFile(__dirname + "/index.html");
  // res.send("Welcome to backend");
});

// Deep linking routes
app.get("/salon/:id", (req, res) => {
  res.sendFile(__dirname + "/deep-linking/salon.html");
});

app.get("/artist/:id", (req, res) => {
  res.sendFile(__dirname + "/deep-linking/artist.html");
});

app.get("/.well-known/assetlinks.json", (req, res) => {
  res.sendFile(__dirname + "/deep-linking/assetlinks.json");
});

app.get("/.well-known/apple-app-site-association",(req,res) =>{
  res.setHeader("Content-Type","application/json").sendFile(__dirname + "/deep-linking/apple-app-site-association");
});

app.listen(PORT, async () => {
  try {
    //connecting to database
    let db = await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to Database!");
    console.log(`App listening on port ${PORT}`);
  } catch (err) {
    console.log(err);
  }
});
