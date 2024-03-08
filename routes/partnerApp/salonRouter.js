const mongoose = require("mongoose");
const router = require("express").Router();
const Salon = require("../../model/partnerApp/Salon");
const Booking = require("../../model/partnerApp/Booking");
const Artist = require("../../model/partnerApp/Artist");
const wrapperMessage = require("../../helper/wrapperMessage");
const Service = require("../../model/partnerApp/Service");
const jwtVerify = require("../../middleware/jwtVerification");
const ObjectId = mongoose.Types.ObjectId;

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
    let data = await Salon.findOne({ _id: req.params.id });
    if (!data) {
      let err = new Error("No such salon exists!");
      err.code = 404;
      throw err;
    }
    let artistData = await Artist.find({ salonId: req.params.id });
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
    let totalBookings = await Booking.find().count("bookings");
    let totalSalons = await Salon.find().count("salons");
    let maxDistance = 0;
    let maxRating = 5;
    let maxDiscount = 50;
    let avgBookings = totalBookings / totalSalons;
    let end = 0;
    if (salons.length < 1000) {
      maxDistance = salons[salons.length - 1].distance;
      end = salons.length - 1;
    } else {
      maxDistance = salons[1000].distance;
      end = 1000;
    }

    for (let itr = 0; itr <= end; itr++) {
      let salon = salons[itr];
      let bookings =
        salon.bookings >= avgBookings ? avgBookings : salon.bookings;
      let discount =
        salon.discount >= maxDiscount ? maxDiscount : salon.discount;
      let score = 0;
      score =
        ((maxDistance - salon.distance) / maxDistance) * 0.6 +
        (discount / maxDiscount || 0) * 0.3 +
        (salon.rating / maxRating || 0) * 0.07 +
        (bookings / avgBookings || 0) * 0.03;

      if (salon.paid) {
        score += 0.2;
      }

      salons[itr]["score"] = score;
    }
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
    let filter = req.query.filter.toLowerCase();
    let typePresent = req.query.type ? true : false;
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
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;
    let discountMin = Number(req.query.min) || 0;
    let discountMax = Number(req.query.max) || 100;
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
      {
        $match: {
          $and: [
            {
              discount: {
                $gte: discountMin,
              },
            },
            {
              discount: {
                $lt: discountMax,
              },
            },
          ],
        },
      },
    ]);
    if (!salons.length) {
      res.status(200).json(wrapperMessage("success", "No result found!", []));
      return;
    }
    let maxDistance = 0;
    let end = 0;
    if (salons.length < 1000) {
      maxDistance = salons[salons.length - 1].distance;
      end = salons.length - 1;
    } else {
      maxDistance = salons[1000].distance;
      end = 1000;
    }

    if (filter === "discount") {
      let maxDiscount = 50;
      for (let itr = 0; itr <= end; itr++) {
        let salon = salons[itr];
        let discount =
          salon.discount >= maxDiscount ? maxDiscount : salon.discount;
        let score = 0;
        score =
          ((maxDistance - salon.distance) / maxDistance) * 0.4 +
          (discount / maxDiscount || 0) * 0.4;

        if (salon.paid) {
          score += 0.2;
        }
        salons[itr]["score"] = score;
      }
    } else if (filter === "rating") {
      let maxRating = 5;
      for (let itr = 0; itr <= end; itr++) {
        let salon = salons[itr];
        let score = 0;
        score =
          ((maxDistance - salon.distance) / maxDistance) * 0.4 +
          (salon.rating / maxRating || 0) * 0.4;

        if (salon.paid) {
          score += 0.2;
        }

        salons[itr]["score"] = score;
      }
    }

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

module.exports = router;
