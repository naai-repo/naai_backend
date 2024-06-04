const router = require("express").Router();
const wrapperMessage = require("../../helper/wrapperMessage");
const User = require("../../model/customerApp/User");
const Artist = require("../../model/partnerApp/Artist");
const Booking = require("../../model/partnerApp/Booking");
const Service = require("../../model/partnerApp/Service");

router.post("/add/user", async (req, res) => {
  try {
    const phoneNumber = req.body.phoneNumber;
    let user = await User.findOne({ phoneNumber: phoneNumber });
    if (user) {
      let data = {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
      };
      res
        .status(200)
        .json(wrapperMessage("success", "User already exists", data));
      return;
    }
    let newUser = new User({
      phoneNumber: phoneNumber,
      userType: "walkin",
    });
    let data = await newUser.save();
    res
      .status(200)
      .json(wrapperMessage("success", "Walkin user added successfully", data));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.get("/users", async (req, res) => {
  try {
    let data = await User.find({ userType: "walkin" });
    res.status(200).json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.get("/users/list", async (req, res) => {
  try {
    const number = req.query.number;
    const aggregation = [
      {
        $addFields: {
          stringPhoneNumber: {
            $toString: "$phoneNumber"
          }
        }
      },
      {
        $match: {
          stringPhoneNumber: {
            $regex: `^${number}`
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          phoneNumber:1,
          gender: 1
        }
      }
    ];
    let data = await User.aggregate(aggregation);
    if(data.length === 0){
      res.status(200).json(wrapperMessage("success", "No user found with this number", []));
      return;
    }
    res.status(200).json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/add/booking", async (req, res) => {
  try{
    let {salon, customer, selectedServices, bill, payments, coupon} = req.body;
    let data = {
      salon,
      customer, 
      selectedServices,
      bill,
      payments,
      coupon
    }
    let uniqueArtists = new Set();
    selectedServices.forEach(service => {
      uniqueArtists.add(service.artistId.toString());
    });

    let paymentAmount = 0;
    payments.forEach(payment => {
      paymentAmount += Number(payment.amount);
    });
    
    let billDate = new Date();

    let paymentsArray = [];
    payments.forEach(payment => {
      paymentsArray.push({
        paymentId: payment.id,
        paymentAmount: payment.amount,
        paymentStatus: payment.amount <= 0 ? "refund" : "completed",
        paymentDate: billDate,
        paymentMode: payment.type
      });
    })

    let artistServiceMap = [];
    for(let service of selectedServices){
      let artistData = await Artist.findOne({ _id: service.artistId });
      let serviceData = await Service.findOne({ _id: service.serviceId });
      if(!artistData){
          let err = new Error("Artist not found");
          err.code = 404;
          throw err;
      }
      if(!serviceData){
          let err = new Error("Service not found");
          err.code = 404;
          throw err;
      }
      let variable = [];
      if(service.variableId && service.variableId !== ""){
        variable = serviceData.variables.filter(variable => variable._id.toString() === service.variableId.toString());
        variable = variable[0];
        console.log(variable);
      }
  
      artistServiceMap.push({
        artistId: service.artistId,
        artistName: artistData.name,
        serviceId: service.serviceId,
        serviceCategory: serviceData.category,
        serviceName: serviceData.serviceTitle,
        variable: {
          variableId: service.variableId || "none",
          variableType: variable.variableType || "none",
          variableName: variable.variableName || "none",
        },
        servicePrice: service.basePrice,
        discountedPrice: service.price,
        chosenBy: "user", 
      })
    }

    let walkinBooking = new Booking({
      userId: customer._id,
      bookingType: uniqueArtists.size > 1 ? "multiple" : "single",
      bookingMode: "walkin",
      salonId: salon,
      amount: bill.originalAmount,
      paymentAmount: paymentAmount,
      bookingStatus: "completed",
      payments: paymentsArray,
      bookingDate: billDate,
      coupon: {
        couponId: coupon.id,
        couponCode: coupon.code,
        discount: coupon.discount,
        max_value: coupon.max_value,
        couponDiscount: coupon.couponDiscount,
      },
      artistServiceMap: artistServiceMap,
    })
    let saveBooking = await walkinBooking.save();
    res.status(200).json(wrapperMessage("success","Booking added for POS", {walkinBooking, saveBooking}));
  }catch(err){
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

// Routes for walkin booking creation!
module.exports = router;
