const router = require("express").Router();
const wrapperMessage = require("../../helper/wrapperMessage");
const User = require("../../model/customerApp/User");
const Artist = require("../../model/partnerApp/Artist");
const Booking = require("../../model/partnerApp/Booking");
const Salon = require("../../model/partnerApp/Salon");
const Service = require("../../model/partnerApp/Service");

router.post("/add/user", async (req, res) => {
  try {
    const phoneNumber = req.body.phoneNumber;
    const salonId = req.body.salonId;
    let user = await User.findOne({ phoneNumber: phoneNumber });
    let salon = await Salon.findOne({_id: salonId});
    if(!salon){
      let err = new Error("Salon not found");
      err.code = 404;
      throw err;
    }
    if (user) {
      let data = {
        id: user._id,
        name: user.name,
        phoneNumber: user.phoneNumber,
        userType: user.userType,
      };
      if(!user.walkinSalons.includes(salonId)){
        user.walkinSalons.push(salonId);
        await user.save();
      }
      if(!salon.WalkinUsers.includes(phoneNumber.toString())){
        salon.WalkinUsers.push(phoneNumber.toString());
        await salon.save();
      }
      res
        .status(200)
        .json(wrapperMessage("success", "User already exists", data));
      return;
    }
    let newUser = new User({
      phoneNumber: phoneNumber,
      name: req.body.name || "",
      gender: req.body.gender.toLowerCase() || "not specified",
      userType: "walkin",
      walkinSalons: [salonId],
    });
    salon.WalkinUsers.push(phoneNumber.toString());
    await salon.save();
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
    const salonId = req.query.salonId;
    let aggregation = [];
    if(number.length === 10){
      aggregation = [
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
            id: "$_id",
            _id: 0,
            name: 1,
            phoneNumber:1,
            gender: 1,
            dues: 1,
            birthDate: 1,
            aniversary: 1,
            email: 1,
          }
        }
      ];
    }else{
      aggregation = [
        {
          $addFields: {
            stringPhoneNumber: {
              $toString: "$phoneNumber"
            },
            userGoesToSalon: {
              $cond: [
                {
                  $setIsSubset: [[{$toObjectId : salonId}], {$ifNull: ["$walkinSalons", []]}]
                },
                true,
                false
              ]
            }
          }
        },
        {
          $match: {
            $and : [
              {
                stringPhoneNumber : {
                  $regex: `${number}`
                }
              },
              {
                userGoesToSalon: true
              }
            ]
          }
        },
        {
          $project: {
            id: "$_id",
            _id: 0,
            name: 1,
            phoneNumber:1,
            gender: 1,
            dues: 1,
            birthDate: 1,
            aniversary: 1,
            email:1,
          }
        }
      ];
    }
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

    let userData = await User.findOne({ _id: customer.id });
    let salonData = await Salon.findOne({ _id: salon });
    if(!salonData){
      let err = new Error("Salon not found");
      err.code = 404;
      throw err;
    }
    if(!userData){
      let err = new Error("User not found");
      err.code = 404;
      throw err;
    }

    if(salonData.WalkinUsers.indexOf(userData.phoneNumber.toString()) === -1){
      console.log("Saved salonData")
      salonData.WalkinUsers.push(userData.phoneNumber.toString());
      await salonData.save();
    }
    if(userData.walkinSalons.indexOf(salon.toString()) === -1){
      console.log("Saved userData")
      userData.walkinSalons.push(salon.toString());
      await userData.save();
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

    let date = billDate.toLocaleString("en-in", {timeZone: "Asia/Kolkata", hourCycle: "h24"});
    date = date.split(", ")[1];
    let time = date.split(":");
    let timeStr = `${time[0]}:${time[1]}`;

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
        timeSlot: {
          start: timeStr,
          end: timeStr,
        },
        chosenBy: "user",
        tax: service.tax || 0,
      })
    }

    let walkinBooking = new Booking({
      userId: customer.id,
      bookingType: uniqueArtists.size > 1 ? "multiple" : "single",
      bookingMode: "walkin",
      salonId: salon,
      amount: bill.originalAmount,
      amountDue: bill.amountDue,
      bill: {
        cashDiscount: bill.cashDisc,
        percentageDiscount: bill.percentDisc,
        percentageDiscountAmount: bill.percentCashDisc,
        duesCleared: bill.duesCleared,
      },
      paymentAmount: paymentAmount,
      bookingStatus: "completed",
      payments: paymentsArray,
      timeSlot: {
        start: timeStr,
        end: timeStr
      },
      bookingDate: billDate,
      coupon: {
        couponId: coupon.id || null,
        couponCode: coupon.code || null,
        discount: coupon.discount || null,
        max_value: coupon.max_value || null,
        couponDiscount: coupon.couponDiscount || null,
      },
      artistServiceMap: artistServiceMap,
    })
    let saveBooking = await walkinBooking.save();
    if(bill.amountDue > 0){
      let dues = userData.dues;
      dues.push({
        bookingId: saveBooking._id,
        salonId: salon,
        amount: bill.amountDue,
        bookingDate: billDate
      });
      userData.dues = dues;
      await userData.save();
    }
    res.status(200).json(wrapperMessage("success","Booking added for POS", {walkinBooking, saveBooking}));
  }catch(err){
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

// Routes for walkin booking creation!

// Route for Clearing Out the Dues

router.post("/clear/dues", async (req, res) => {
  try{
    let {userId, salonId, amountPaid} = req.body;
    amountPaid = Number(amountPaid);
    let userData = await User.findOne({ _id: userId });
    if(!userData){
      let err = new Error("User not found");
      err.code = 404;
      throw err;
    }
    if(amountPaid === 0){
      let err = new Error("No Dues Paid");
      err.status = "success"
      err.code = 200;
      throw err;
    }
    let dues = userData.dues;
    let salonFound = false;
    let newDues = [];
    while(amountPaid > 0 && dues.length > 0){
      let due = dues[0];
      if(due.salonId.toString() !== salonId.toString()){
        newDues.push(due);
        dues.shift();
        continue;
      }else{
        salonFound = true;
        let booking = await Booking.findOne({ _id: due.bookingId });
        let amount = due.amount;
        if(amountPaid >= amount){
          amountPaid -= amount;
          booking.paymentAmount += amount;
          booking.amountDue -= amount;
          await booking.save();
          dues.shift();
        }else{
          amount -= amountPaid;
          booking.paymentAmount += amountPaid;
          booking.amountDue -= amountPaid;
          await booking.save();
          due.amount = amount;
          newDues.push(due);
          dues.shift();
          amountPaid = 0;
        }
      }
    }
    while(dues.length > 0){
      let due = dues.shift();
      newDues.push(due);
    }
    if(!salonFound && amountPaid > 0){
      let err = new Error("No dues found for this salon");
      err.status = "success"
      err.code = 200;
      throw err;
    }
    userData.dues = newDues;
    let newUserData = await userData.save();
    res.status(200).json(wrapperMessage("success", "Dues cleared successfully", newUserData));
  }catch(err){
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message));
  }
});
module.exports = router;
