const mongoose = require("mongoose");
const router = require("express").Router();
const Salon = require("../../model/partnerApp/Salon");
const Booking = require("../../model/partnerApp/Booking");
const Artist = require("../../model/partnerApp/Artist");
const Partner = require("../../model/partnerApp/Partner");
const User = require("../../model/customerApp/User");
const wrapperMessage = require("../../helper/wrapperMessage");
const Service = require("../../model/partnerApp/Service");
const jwtVerify = require("../../middleware/jwtVerification");
const CommonUtils = require("../../helper/commonUtils");
const FilterUtils = require("../../helper/filterUtils");
const ObjectId = mongoose.Types.ObjectId;
const Commission = require('../../model/partnerApp/comission');


// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

// Getting the Salons and searching salons
router.get("/", async (req, res) => {
  try {
    let name = req.query.name;
    let type = req.query.type;
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;
    let queryObject = {};
    if (type) {
      queryObject = { $or: [{ salonType: type }, { salonType: "unisex" }] };
    }
    if (name) {
      queryObject.name = { $regex: name, $options: "i" };
    }

    const salons = await Salon.find(queryObject).skip(skip).limit(limit);
    let salonIdsToFilter = salons.map((salon) => salon._id);
    const aggregation = [
      {
        $match: {
          salonId: { $in: salonIdsToFilter }, // Filter services based on the specified salonIds
        },
      },
      {
        $group: {
          _id: "$salonId",
          totalServices: { $sum: 1 }, // Count services for each salon
          totalBasePrice: { $sum: "$basePrice" },
          avgBasePrice: { $avg: "$basePrice" }, // Sum base prices for each salon
        },
      },
    ];
    let salonAvgServicePrice = await Service.aggregate(aggregation);
    let salonsData = salons.map((obj) => {
      let salonId = obj._id;
      let extraData = salonAvgServicePrice.find((item) =>
        salonId.equals(item._id)
      );
      let ob = Object.assign(obj.toObject());

      return { ...obj.toObject(), ...extraData };
    });
    res.status(200).json({ data: salonsData, hits: salons.length });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// Adding new Salons, use the above mentioned userId, saloonId and artist Id
router.post("/add", async (req, res) => {
  const newSalon = req.body;
  try {
    newSalon.location = {
      type: "Point",
      coordinates: newSalon.location.coordinates,
    };
    const salon = await new Salon(newSalon).save();
    res.status(200).json(salon);
  } catch (err) {
    console.log(err);
    res.status(500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/add/:id/services/", async (req, res) => {
  try {
    let services = req.body.services;
    if (!services) {
      let err = new Error("No services selected!");
      err.code = 400;
      throw err;
    }
    let salonData = await Salon.findOne({ _id: req.params.id });
    if (!salonData) {
      let err = new Error("No such salon exists!");
      err.code = 404;
      throw err;
    }
    let discount = salonData.discount;
    let servicePromiseArr = [];
    services.forEach((service) => {
      let minTime = service.variables.reduce((acc, curr) =>
        Math.min(acc.variableTime || acc, curr.variableTime)
      );
      let minPrice = service.variables.reduce((acc, curr) =>
        Math.min(acc.variablePrice || acc, curr.variablePrice)
      );
      service.variables.forEach((variable) => {
        let variablePrice =
          variable.variablePrice - (variable.variablePrice * discount) / 100;
        variable.variableCutPrice = variable.variablePrice;
        variable.variablePrice = variablePrice;
      });
      let price = minPrice - (minPrice * discount) / 100;
      service.cutPrice = minPrice;
      service.basePrice = price;
      service.avgTime = minTime;
      let newService = new Service({
        ...service,
        salonId: req.params.id,
      });
      servicePromiseArr.push(newService.save());
    });
    let serviceData = await Promise.all(servicePromiseArr);
    res
      .status(200)
      .json(
        wrapperMessage("success", "Services added to the salon", serviceData)
      );
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/remove/:id/services/", async (req, res) => {
  try {
    let services = req.body.services;
    let salonId = req.body.salonId;
    if (salonId.toString() !== req.params.id.toString()) {
      let err = new Error(
        "You are not authorized to remove services from this salon!"
      );
      err.code = 403;
      throw err;
    }
    if (!services) {
      let err = new Error("No services selected!");
      err.code = 400;
      throw err;
    }
    let salonData = await Salon.findOne({ _id: req.params.id });
    if (!salonData) {
      let err = new Error("No such salon exists!");
      err.code = 404;
      throw err;
    }
    let servicePromiseArr = [];
    services.forEach((service) => {
      servicePromiseArr.push(Service.deleteOne({ _id: service }));
    });
    let serviceData = await Promise.all(servicePromiseArr);
    res
      .status(200)
      .json(
        wrapperMessage(
          "success",
          "Services removed from the salon",
          serviceData
        )
      );
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/:id/update", async (req, res) => {
  try {
    let data = await Salon.updateOne({ _id: req.params.id }, req.body);
    res.json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
});

router.get("/single/:id", async (req, res) => {
  try {
    let data = await Salon.findOne({ _id: req.params.id }).populate('activeSubscriptions').exec()
    if (!data) {
      let err = new Error("No such salon exists!");
      err.code = 404;
      throw err;
    }
    let artistData = await Artist.find({ salonId: req.params.id });
    let artistDiscountedServicesPromiseArr = [];
    for (let artist of artistData) {
      artistDiscountedServicesPromiseArr.push(
        CommonUtils.addDiscountToServices(data.discount, artist.services)
      );
    }
    let artistDiscountedServicesArr = await Promise.all(
      artistDiscountedServicesPromiseArr
    );
    for (let index in artistDiscountedServicesArr) {
      artistData[index].services = artistDiscountedServicesArr[index];
    }
    let serviceIds = new Set();
    artistData.forEach((artist) => {
      artist.services.forEach((service) => {
        serviceIds.add(service.serviceId.toString());
      });
    });
    serviceIds = Array.from(serviceIds);
    serviceIds = serviceIds.map((id) => new ObjectId(id));
    let serviceData = await Service.aggregate([
      {
        $match: {
          _id: { $in: serviceIds },
        },
      },
    ]);
    res.json(
      wrapperMessage("success", "", {
        data,
        artists: artistData,
        services: serviceData,
      })
    );
  } catch (err) {
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
});

router.post("/topSalons", async (req, res) => {
  try {
    let location = req.body.location;
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;
    let typePresent = req.query.type ? true : false;
    let salons = await Salon.aggregate([
      {
        $geoNear: {
          near: location,
          distanceField: "distance",
          distanceMultiplier: 0.001,
        },
      },
      {
        $match: {
          live: true,
        },
      },
      {
        $match: {
          $or: [
            { salonType: req.query.type },
            { salonType: "unisex" },
            {
              $and: [
                { randomFieldToCheck: { $exists: typePresent } },
                {
                  $or: [
                    { salonType: "male" },
                    { salonType: "female" },
                    { salonType: "unisex" },
                  ],
                },
              ],
            },
          ],
        },
      },
    ]);

    if (!salons.length) {
      res.status(200).json(wrapperMessage("success", "No result found!", []));
      return;
    }

    let salonsData = await FilterUtils.getScore(
      
      "relevance",
     
      salons,
     
      "desc",
     
      []
    
    );
    salons = salonsData.salons;
    end = salonsData.end;
    salons.sort((a, b) => {
      if (a.score < b.score) return 1;
      else if (a.score > b.score) return -1;
      else return 0;
    });
    let data = [];
    for (let itr = skip; itr < skip + limit; itr++) {
      if (!salons[itr]) {
        break;
      }
      data.push(salons[itr]);
    }
    res.status(200).json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.status(500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/filter", async (req, res) => {
  try {
    let filter = req.query.sortBy?.toLowerCase() || "relevance";
    let priceTags = req.query.priceTag || [];
    priceTags = priceTags.map((ele) => ele.toLowerCase());
    console.log(priceTags);
    let order = req.query.order?.toLowerCase() || "desc";
    let typePresent = req.query.gender ? true : false;
    if (!filter) {
      let error = new Error("Invalid filter selected!");
      error.code = 400;
      throw error;
    }
    let location = req.body.location;
    if (!location) {
      let error = new Error("Invalid location selected!");
      error.code = 400;
      throw error;
    }
    // constants or variables values
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;
    let discountMin = Number(req.query.minDiscount) || 0;
    let discountMax = Number(req.query.maxDiscount) || 100;
    let ratingMin = Number(req.query.minRating) || 0;
    let ratingMax = Number(req.query.maxRating) || 5;
    let distance = isNaN(Number(req.query.distance))
      ? null
      : Number(req.query.distance);
    let end = 0;
    let category = req.query.category;
    let queryObject = [];
    let salonArr = [];
    if (category) {
      let serviceTitleMatch = category.map((ele) => ({
        serviceTitle: { $regex: ele, $options: "i" },
      }));
      let categoryMatch = category.map((ele) => ({
        category: { $regex: ele, $options: "i" },
      }));
      queryObject.push({ $or: serviceTitleMatch });
      queryObject.push({ $or: categoryMatch  });
      let serviceArr = await Service.find({
        $or: queryObject,
        $nor: [{ salonId: null }],
      });
      let set = new Set();
      salonArr = serviceArr.map((ele) => set.add(ele.salonId.toString()));
      salonArr = Array.from(set);
      salonArr = salonArr.map((ele) => new ObjectId(ele));
    }

    let geoNear = [];

    if (distance) {
      geoNear.push({
        $geoNear: {
          near: location,
          distanceField: "distance",
          maxDistance: distance * 1000,
          distanceMultiplier: 0.001,
        },
      });
    } else {
      geoNear.push({
        $geoNear: {
          near: location,
          distanceField: "distance",
          distanceMultiplier: 0.001,
        },
      });
    }
    if (category) {
      geoNear.push({
        $match: {
          _id: {
            $in: salonArr,
          },
        },
      });
    }

    let salons = await Salon.aggregate(
      FilterUtils.aggregationForDiscount(
        geoNear,
        req.query.gender,
        typePresent,
        discountMax,
        discountMin,
        ratingMax,
        ratingMin
      )
    );

    if (!salons.length) {
      res.status(200).json(wrapperMessage("success", "No result found!", []));
      return;
    }

    let salonsData = await FilterUtils.getScore(
      filter,
      salons,
      order,
      priceTags
    );

    salons = salonsData.salons;
    end = salonsData.end;

    salons.sort((a, b) => {
      if (a.score < b.score) return 1;
      else if (a.score > b.score) return -1;
      else return 0;
    });

    let data = [];
    for (let itr = skip; itr < skip + limit; itr++) {
      if (!salons[itr]) {
        break;
      }
      data.push(salons[itr]);
    }
    res.status(200).json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/update/discount", async (req, res) => {
  try {
    let discount = Number(req.body.discount);
    let salonId = req.body.salonId;
    let startDate = req.body.startDate;
    let endDate = req.body.endDate;
    let salonData = await Salon.findOne({ _id: salonId });
    if (!salonData) {
      let err = new Error("No such salon exists!");
      err.code = 404;
      throw err;
    }
    salonData.discount = discount;
    if (!startDate) {
      salonData.discountTime.start = "";
    } else {
      startDate = startDate.split("/").map((item) => Number(item));
      salonData.discountTime.start = new Date(
        startDate[2],
        startDate[0] - 1,
        startDate[1],
        0,
        0
      ).toISOString();
    }
    if (!endDate) {
      salonData.discountTime.end = "";
    } else {
      endDate = endDate.split("/").map((item) => Number(item));
      salonData.discountTime.end = new Date(
        endDate[2],
        endDate[0] - 1,
        endDate[1],
        0,
        0
      ).toISOString();
    }
    await salonData.save();
    await CommonUtils.updateDiscountedServicePrice(salonId, discount);
    res
      .status(200)
      .json(wrapperMessage("success", "Discount updated successfully!"));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});
router.post("/getSalonDataForDashboard", async (req, res) => {
  try {
    let salonId = req.body.salonId;
    let startDate = req.body.startDate;
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate()+1);
    let data = await Booking.aggregate([
      {
        $match: {
          salonId: new ObjectId(salonId),
          // Adjust
          bookingDate: {
            $gte: new Date(startDate),
            $lt: endDate
          },
        },
      },
      {
        $unwind: "$artistServiceMap",
      },
      {
        $group: {
          _id: "$artistServiceMap.artistId",
          bookings: {
            $push: {
              artistServiceMap: "$artistServiceMap",
              timeSlot: "$timeSlot",
              bookingMode: "$bookingMode",
              bookingId: "$_id",
              userId: "$userId",
              userName:"$userName",
              bookingStatus: "$bookingStatus",
            },
          },
        },
      },
      {
        $lookup: {
          from: "artists",
          let: { artistId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$artistId"] } } },
            { $project: { offDay: 1, timing: 1 } },
          ],
          as: "artistData",
        },
      },
      {
        $unwind: {
          path: "$artistData",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.get("/delete/test/:id", async (req, res) => {
  try {
    let salon = await Salon.findOneAndDelete({ _id: req.params.id });
    console.log(salon);
    if (!salon) {
      res.status(404).json(wrapperMessage("failed", "No such salon exists!"));
    }
    res
      .status(200)
      .json(wrapperMessage("success", "Salon deleted successfully!", salon));
  } catch (err) {
    console.log(err);
    res.status(500).json(wrapperMessage("failed", err.message));
  }
});

// salon walkin customer
router.post("/customerList", async (req, res) => {
  try {
    const salonId = req.body.salonId;
    const salonData = await Salon.findOne({ _id: salonId });

    if (!salonData) {
      let err = new Error("No such salon exists!");
      err.code = 404;
      throw err;
    }

    const query = { phoneNumber: { $in: salonData.WalkinUsers } };
    const users = await User.find(query);

    if (users.length === 0) {
      let err = new Error("No users found!");
      err.code = 404;
      throw err;
    }

    res.status(200).json(wrapperMessage("success", "Salon users", users));
  } catch (err) {
    console.error(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post('/getCustomerByNumber', async (req, res) => {
  try {
    let phoneNumber = req.body.phoneNumber;
    let user = await User.findOne({ phoneNumber: phoneNumber });
    res.status(200).json(wrapperMessage("success", "Salon users", user));
  } catch (err) {
    console.error(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
})

// router.post("/addCustomer", async (req, res) => {
//   try {
//     let salonId = req.body.salonId;
//     let customer = req.body.customer;
//     const salonData = await Salon.findOne({ _id: salonId });

//     if (!salonData) {
//       let err = new Error("No such salon exists!");
//       err.code = 404;
//       throw err;
//     }

//     const foundUser = await User.findOne({
//       phoneNumber: customer.phoneNumber,
//     });

//     // const user = new User(customer);
    
//     const foundWalkinUser = salonData.WalkinUsers.includes(
//       user.phoneNumber.toString()
//     );

//     if (foundWalkinUser) {
//       let err = new Error("User with this phone number alreay exist in salon");
//       err.code = 404;
//       throw err;
//     }

//     salonData.WalkinUsers.push(user.phoneNumber.toString());

//     if (!foundUser) {
//       user.walkinSalons.push(new ObjectId(salonId))
//      await user.save();
//     }
//     await salonData.save();
//     res
//       .status(200)
//       .json(wrapperMessage("success", "user created successfully", user));
//   } catch (err) {
//     res.status(err.code || 500).json(wrapperMessage("failed", err.message));
//   }
// });


router.post("/addCustomer", async (req, res) => {
  try {
    let salonId = req.body.salonId;
    let customer = req.body.customer;
    const salonData = await Salon.findOne({ _id: salonId });

    if (!salonData) {
      let err = new Error("No such salon exists!");
      err.code = 404;
      throw err;
    }

    const foundUser = await User.findOne({
      phoneNumber: customer.phoneNumber,
    });
    
    const foundWalkinUser = salonData.WalkinUsers.includes(
      customer.phoneNumber.toString()
    );

    if (foundWalkinUser) {
      let err = new Error("User with this phone number alreay exist in salon");
      err.code = 404;
      throw err;
    }

    salonData.WalkinUsers.push(customer.phoneNumber.toString());

    let user = foundUser;
    if (!foundUser) {
      const newUser = new User(customer);
      newUser.walkinSalons.push(new ObjectId(salonId));
      user = newUser
      await newUser.save();
    }
    await salonData.save();
    res
      .status(200)
      .json(wrapperMessage("success", "user created successfully", user));
  } catch (err) {
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/customers/search", async (req, res) => {
  try {
    const salonId = req.body.salonId;
    const search = req.body.search;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    const salon = await Salon.findOne({ _id: salonId });
    if (!salon) {
      let err = new Error("No such salon exists!");
      err.code = 404;
      throw err;
    }

    let users = [];

    if (isNaN(Number(search))) {
      users = await User.find({walkinSalons: salonId,
        name: { $regex: search, $options: "i" },}).skip(skip).limit(limit);
    } else {
      const searchUsers = salon.WalkinUsers.filter((number) =>
        number.includes(search)
      );
      const paginatedUsers = searchUsers.slice(skip, skip + limit);
      users = await User.find({ phoneNumber: { $in: paginatedUsers } });
    }
    res
      .status(200)
      .json(wrapperMessage("success", "user created successfully", users));
  } catch (err) {
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/customers/filter", async (req, res) => {
  try {
    let salonId = req.body.salonId;
    let filter = req.body.filter;
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    let skip = (page - 1) * limit;

    if (!filter) {
      let error = new Error("Invalid filter selected!");
      error.code = 400;
      throw error;
    }
    
    const filterCriteria = { walkinSalons: salonId, gender: filter.gender };

    const users = await User.find(filterCriteria).skip(skip).limit(limit);

    res.status(200).json(wrapperMessage("success", "Salon users", users));
  } catch (err) {
    console.error(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});


//get commisin by partnr id


router.post('/:salonId/addComission', async (req, res) => {
  const salonId = req.params.salonId;
  const commissionData = req.body;

  try {
      const salon = await Salon.findById(salonId);
      if (!salon) {
          return res.status(404).json({ error: 'Salon not found' });
      }
      const newCommission = new Commission({
          salon: salonId,
          ...commissionData
      });
      await newCommission.save();
      res.status(201).json({ message: 'Commission added successfully', commission: newCommission });
  } catch (error) {
      console.error('Error adding commission:', error);
      res.status(500).json({ error: 'Failed to add commission' });
  }
});

router.post('/updateCommission/:commissionId', async (req, res) => {
  const { commissionId } = req.params;
  const commissionData = req.body;

  try {

    // Find the commission to update
    const commission = await Commission.findById(commissionId);
    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    // Update commission fields with new data
    Object.assign(commission, commissionData);

    // Save the updated commission
    await commission.save();

    // Return the updated commission
    res.status(200).json({ message: 'Commission updated successfully', commission });
  } catch (error) {
    console.error('Error updating commission:', error);
    res.status(500).json({ error: 'Failed to update commission' });
  }
});

// router.post("/apply-commission", async (req, res) => {
//   const { commissionId, partnerId } = req.body;
//   try {
//     // Fetch the specified Commission Template
//     const commission = await Commission.findById(commissionId);
//     if (!commission) {
//       return res.status(404).json({ message: "Commission template not found" });
//     }

    
//     const partner = await Partner.findById(partnerId);
//     if (!partner) {
//       return res.status(404).json({ message: "partner not found" });
//     }

//     partner.commission = commissionId;
//     await partner.save();

//     res.status(200).json({
//       message: "Commission template applied to the partner",
//       partner,
//     });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });





router.post("/apply-commission", async (req, res) => {
  const { commissionId, partnerId, salonId, startDate } = req.body;
  try {
    // Check if the commission template exists
    const commissionTemplate = await Commission.findById(commissionId);
    if (!commissionTemplate) {
      return res.status(404).json({ message: "Commission template not found" });
    }

    // Check if the partner exists
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Check if a commission is already attached to the partner
    const existingCommission = await Commission.findOne({ partnerId });
    if (existingCommission) {
      return res.status(400).json({
        message: "Commission already attached to this partner",
      });
    }

    // Create a new commission using the template
    const newCommission = new Commission({
      startDate: startDate || commissionTemplate.startDate,
      salon: salonId,
      partnerId,
      name: commissionTemplate.name,
      brackets: commissionTemplate.brackets.map(bracket => ({
        revenue_from: bracket.revenue_from,
        revenue_to: bracket.revenue_to,
        type: bracket.type,
        value: bracket.value
      })),
      duration_type: commissionTemplate.duration_type,
      active: commissionTemplate.active,
    });

    // Save the new commission
    await newCommission.save();

    // Update the partner to include the new commission
    await Partner.findByIdAndUpdate(partnerId, {
      commission: newCommission._id,
    });

    res.status(200).json({
      message: "Commission template applied to the partner",
      commission: newCommission,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.get('/commissions/:salonId', async (req, res) => {
  try {
      const { salonId } = req.params;
      const commissions = await Commission.find({ salon: salonId })
      // const commissions = await Commission.find({ salon: salonId }).populate('salon').populate('partnerId');
      
      if (!commissions.length) {
          return res.status(404).json({ message: 'No commissions found for the given salon ID' });
      }
      
      res.status(200).json(commissions);
  } catch (error) {
      res.status(500).json({ message: 'Server error', error });
  }
});

router.delete('/deleteCommission/:commissionId', async (req, res) => {
  const { commissionId } = req.params;

  try {

    const commission = await Commission.findByIdAndDelete(commissionId);
    if (!commission) {
      return res.status(404).json({ error: 'Commission not found' });
    }

    res.status(200).json({ message: 'Commission deleted successfully' });
  } catch (error) {
    console.error('Error deleting commission:', error);
    res.status(500).json({ error: 'Failed to delete commission' });
  }
});

router.post("/staff", async (req, res) => {
  try{
    const salonId = req.body.salonId;
    const staff = await Partner.find({salonId});
    res.status(200).json(wrapperMessage("success", "Staff Fetched Successfully", staff));
  }catch(err){
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message));
  }
})


router.get("/get-commission/:partnerId", async (req, res) => {
  const { partnerId } = req.params;
  try {
    // Find the partner by ID and populate the commission details
    const partner = await Partner.findById(partnerId).populate('commission');
    if (!partner) {
      return res.status(404).json({ message: "Partner not found" });
    }

    // Check if the partner has a commission
    if (!partner.commission) {
      return res.status(404).json({ message: "Commission not found for this partner" });
    }

    res.status(200).json({
      message: "Commission details retrieved successfully",
      commission: partner.commission,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



module.exports = router;
