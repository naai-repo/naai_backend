const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const cors = require('cors');
const cookieParser = require("cookie-parser");
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
const PlanRouter = require("./routes/partnerApp/planRouter");
const SubscriptionRouter =require('./routes/subscriptionRoutes/subscription.routes') 
const salaryRouter = require('./routes/salaryRoutes/salary.routes')
const InventoryRouter = require('./routes/inventoryRoutes/inventory.routes')
const WalkinRouter = require("./routes/partnerApp/walkinRouter")


// Customer App
const UserRouter = require("./routes/customerApp/userRouter");
const UserOtpRouter = require("./routes/customerApp/otpRouter");
const LocationRouter = require("./routes/customerApp/locationRouter");

// Booking Appointment
const SchedulingRouter = require("./routes/bookingRoutes/schedulingRoutes");

// Sales Router
const SalesRouter = require("./routes/salesRoutes/sales.routes");

// Referral System
const ReferralRouter = require("./routes/referralRoutes/referral.routes");

// Coupons System
const CouponsRouter = require("./routes/couponRoutes/coupon.routes");

// POS System
const PosRouter = require("./routes/posRoutes/pos.routes");

// Promotions System
const PromotionRouter = require("./routes/promotionRoutes/promotion.routes");

// URL Shortner
const UrlController = require("./controllers/urlController/url.controller");

// Attendance Router
const AttendanceRouter = require("./routes/attendanceAndLeaves/attendance.routes");

// Leave Router
const LeaveRouter = require("./routes/attendanceAndLeaves/leave.routes");

// Features and Pages Router
const FeatureRouter = require("./routes/featuresAndPages/feature.routes");

// Access Control Router
const AccessRouter = require("./routes/accessControl/accessRole.routes");

// Membership Router
const MembershipRouter = require("./routes/membershipRoutes/membership.routes");

// set the view engine to ejs
app.set("view engine", "ejs");
app.use("/public", express.static("public"));
app.use(cors());

// MiddleWares
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.COOKIE_SECURE },
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
app.use("/salon/inventory", InventoryRouter);
app.use("/partner/walkin", WalkinRouter);

// Customer App Routes
app.use("/customer/user", UserRouter);
app.use("/customer/otp", UserOtpRouter);
app.use("/customer/user/location", LocationRouter);

// Plan Routes
app.use("/plan", PlanRouter);

//subscription routes
app.use('/subscription',SubscriptionRouter)

//salary routes
app.use('/salary',salaryRouter)

// Scheduling Appointments
app.use("/appointments", SchedulingRouter);

// Sales Routes
app.use("/sales", SalesRouter);

// Referral System Routes
app.use("/referral", ReferralRouter);

// Coupons System Routes
app.use("/coupons", CouponsRouter);

// POS Routes
app.use("/pos", PosRouter);

// Promotion Routes
app.use("/promotion", PromotionRouter);

// Attendance Routes
app.use("/attendance", AttendanceRouter);

// Leave Routes
app.use("/leave", LeaveRouter);

// Features and Pages Routes
app.use("/feature", FeatureRouter);

// Access Control Routes
app.use("/access", AccessRouter);

// Membership Routes
app.use("/membership", MembershipRouter);

app.get("/", async (req, res) => {
  res.sendFile(__dirname + "/index.html");
  // res.send("Welcome to backend");
});

// URL Shortner
app.post("/url/shorten", UrlController.ShortenUrl);
app.get("/:key", UrlController.RedirectUrl);

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

app.get("/.well-known/apple-app-site-association", (req, res) => {
  res
    .setHeader("Content-Type", "application/json")
    .sendFile(__dirname + "/deep-linking/apple-app-site-association");
});

app.get("/sales/login-page", (req, res) => {
  res.render("referralSystem/login");
});

app.get("/sales/salon-onboarding", (req, res) => {
  let hasReferral = req.query.ref ? true : false;
  res.render("referralSystem/salon-onboarding", {
    hasReferral,
    referral_code: req.query.ref,
  });
});

app.get("/server", (req, res) => {
  let server = req.query.server?.toLowerCase();
  if(server === "dev"){
    res.json({server: process.env.DEV_SERVER})
  }else{
    res.json({server: process.env.PROD_SERVER})
  }
})

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
