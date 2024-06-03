const router = require("express").Router();
const Service = require("../../model/partnerApp/Service");
const wrapperMessage = require("../../helper/wrapperMessage");
const Salon = require("../../model/partnerApp/Salon");
const Booking = require("../../model/partnerApp/Booking");
const mongoose = require("mongoose");
const { getArtistsListGivingService } = require("../../helper/serviceHelper");
const Artist = require("../../model/partnerApp/Artist");
const ObjectId = mongoose.Types.ObjectId;

// Getting all the Services
router.get("/", async (req, res) => {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;

    const data = await Service.find().skip(skip).limit(limit);
    res.status(200).json({ data, hits: data.length });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Adding new Services, use the above mentioned userId, saloonId and artist Id
router.post("/add", async (req, res) => {
  try {
    if (req.body.salonId) {
      let salonId = req.body.salonId;
      let salon = await Salon.findOne({ _id: salonId });
      if (!salon) {
        let err = new Error("Salon not found!");
        err.code = 404;
        throw err;
      }
      let discount = salon.discount;
      let price = req.body.basePrice - (req.body.basePrice * discount) / 100;
      req.body.cutPrice = req.body.basePrice;
      req.body.basePrice = price;
      console.log("here" , req.body.variables.length);
      if (req.body.variables) {
        for (let variable of req.body.variables) {
          variable.variableCutPrice = variable.variablePrice;
          variable.variablePrice =
            variable.variablePrice - (variable.variablePrice * discount) / 100;
        }
        let minTime = req.body.variables.reduce((a, b) =>
          Math.min(a.variableTime || a, b.variableTime)
        );
        let minPrice = req.body.variables.reduce((a, b) =>
          Math.min(a.variablePrice || a, b.variablePrice)
        );
        req.body.avgTime = minTime;
        req.body.basePrice = minPrice;
      }
    }
    const newService = new Service(req.body);
    const service = await newService.save();
    res.status(200).json(service);
  } catch (err) {
    res.status(500).json(err);
    console.log(err);
  }
});

// Getting different service categories
router.get("/category/all", async (req, res) => {
  try {
    let salonId = req.query.salonId;
    let gender = req.query.sex;
    if(!salonId){
      let err = new Error("Salon ID is required!");
      err.code = 400;
      throw err;
    }
    let serviceData = await Service.aggregate([
        {
          $match: {
            salonId: new ObjectId(salonId),
            $or: [
              {
                targetGender: gender.toLowerCase(),
              },
              {
                targetGender: "unisex"
              }
            ]
          }
        },
        {
          $group: {
            _id: null,
            unique_categories: {
              $addToSet: "$category",
            },
          },
        }
    ]);
    res
      .status(200)
      .json(wrapperMessage("success", "", serviceData[0].unique_categories));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

// Getting individual services
router.get("/single/:id", async (req, res) => {
  try {
    let service = await Service.findOne({ _id: req.params.id });
    if (!service) {
      let err = new Error("Service not found!");
      err.code = 404;
      throw err;
    }
    res.json(wrapperMessage("success", "", service));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/:id/update", async (req, res) => {
  try {
    let data = await Service.updateOne({ _id: req.params.id }, req.body);
    if (!data.modifiedCount) {
      let err = new Error("Some Error occured please try again!");
      err.code = 500;
      throw err;
    }
    res.json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

// Searching category for salons in top salon order
router.post("/search/salon", async (req, res) => {
  try {
    let name = req.query.name;
    let queryObject = [];
    if (name) {
      queryObject.push({ serviceTitle: { $regex: name, $options: "i" } });
      queryObject.push({ category: { $regex: name, $options: "i" } });
    }

    let serviceArr = await Service.find({
      $or: queryObject,
      $nor: [{ salonId: null }],
    });
    let set = new Set();
    let salonArr = serviceArr.map((ele) => set.add(ele.salonId.toString()));
    salonArr = Array.from(set);
    salonArr = salonArr.map((ele) => new ObjectId(ele));

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
          _id: {
            $in: salonArr,
          },
        },
      },
      {
        $match: {
          live: true
        }
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
      let score = 0;
      score =
        ((maxDistance - salon.distance) / maxDistance) * 0.6 +
        (salon.discount / maxDiscount) * 0.3 +
        (salon.rating / maxRating) * 0.07 +
        (bookings / avgBookings) * 0.03;

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

    res.status(200).json(wrapperMessage("success", "", { list: data }));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

// Searching category for artists in top artists order
router.post("/search/artist", async (req, res) => {
  try {
    let name = req.query.name;
    let artistList = [];
    if (name) {
      artistList = await getArtistsListGivingService(name);
    }
    let artistArr = artistList.map((ele) => new ObjectId(ele));
    let location = req.body.location;
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 15;
    let skip = (page - 1) * limit;
    let typePresent = req.query.type ? true : false;
    let artists = await Artist.aggregate([
      {
        $geoNear: {
          near: location,
          distanceField: "distance",
          distanceMultiplier: 0.001,
        },
      },
      {
        $match: {
          _id: {
            $in: artistArr,
          },
        },
      },
      {
        $match: {
          $or: [
            { targetGender: req.query.type },
            { targetGender: "unisex" },
            {
              $and: [
                { randomFieldToCheck: { $exists: typePresent } },
                {
                  $or: [
                    { targetGender: "male" },
                    { targetGender: "female" },
                    { targetGender: "unisex" },
                  ],
                },
              ],
            },
          ],
        },
      },
    ]);
    if (!artists.length) {
      res.status(200).json(wrapperMessage("success", "No result found!", []));
      return;
    }
    let totalBookings = await Booking.find().count("val");
    let totalArtists = await Artist.find().count("artist");
    let maxDistance = 0;
    let maxRating = 5;
    let avgBookings = totalBookings / totalArtists;
    let end = 0;
    if (artists.length < 1000) {
      maxDistance = artists[artists.length - 1].distance;
      end = artists.length - 1;
    } else {
      maxDistance = artists[1000].distance;
      end = 1000;
    }

    for (let itr = 0; itr <= end; itr++) {
      let artist = artists[itr];
      let bookings =
        artist.bookings >= avgBookings ? avgBookings : artist.bookings;
      let score = 0;
      score =
        ((maxDistance - artist.distance) / maxDistance) * 0.5 +
        (artist.rating / maxRating) * 0.3 +
        (bookings / avgBookings) * 0.2;

      if (artist.paid) {
        score += 0.2;
      }

      artists[itr]["score"] = score;
    }
    artists.sort((a, b) => {
      if (a.score < b.score) return 1;
      else if (a.score > b.score) return -1;
      else return 0;
    });
    let data = [];
    for (let itr = skip; itr < skip + limit; itr++) {
      if (!artists[itr]) {
        break;
      }
      data.push(artists[itr]);
    }

    res.status(200).json(wrapperMessage("success", "", { list: data }));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

// Salon Filter for searhing name
router.get("/title/search", async (req, res) => {
  try {
    let name = req.query.name;
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;
    let queryObject = [];
    if (name) {
      queryObject.push({ serviceTitle: { $regex: name, $options: "i" } });
      queryObject.push({ category: { $regex: name, $options: "i" } });
    }
    let serviceArr = await Service.find({ $or: queryObject }).select({
      salonIds: 0,
      createdAt: 0,
      __v: 0,
      updatedAt: 0,
    }).skip(skip).limit(limit);

    if(!serviceArr.length) {
      let err = new Error("No result found!");
      err.code = 404;
      throw err;
    }
    
    res.status(200).json(
      wrapperMessage("success", "", {
        list: serviceArr,
        category: serviceArr[0].category,
      })
    );
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

module.exports = router;
