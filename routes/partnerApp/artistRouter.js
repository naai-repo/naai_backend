const router = require("express").Router();
const mongoose = require("mongoose");
const Artist = require("../../model/partnerApp/Artist");
const Salon = require("../../model/partnerApp/Salon");
const Booking = require("../../model/partnerApp/Booking");
const wrapperMessage = require("../../helper/wrapperMessage");
const jwtVerify = require("../../middleware/jwtVerification");
const Service = require("../../model/partnerApp/Service");
const CommonUtils = require("../../helper/commonUtils");

// User ID : 64f786e3b23d28509e6791e0
// saloon ID : 64f786e3b23d28509e6791e1
// Artist ID : 64f786e3b23d28509e6791e2

// Getting and searching the Artists

router.get("/", async (req, res) => {
  try {
    let name = req.query.name;
    let type = req.query.type;
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;
    let queryObject = {};
    if (type) {
      queryObject = {
        $or: [{ targetGender: type }, { targetGender: "unisex" }],
      };
    }
    if (name) {
      queryObject.name = { $regex: name, $options: "i" };
    }

    const data = await Artist.find(queryObject).skip(skip).limit(limit);
    res.status(200).json({ data, hits: data.length });
  } catch (err) {
    res.status(500).json(err);
  }
});

// Adding new Artists, use the above mentioned userId, saloonId and artist Id

router.post("/add", async (req, res) => {
  let newArtist = req.body;
  try {
    if (newArtist.salonId !== "000000000000000000000000") {
      let salonData = await Salon.find({ _id: newArtist.salonId });
      if (!salonData.length) {
        throw new Error("No such Salon exists!");
      }
      newArtist = new Artist({
        ...newArtist,
        location: salonData[0].location,
      });
      const artist = await newArtist.save();
      res.status(200).json(artist);
    } else {
      newArtist = new Artist({
        ...newArtist,
        location: {
          type: "Point",
          coordinates: [0, 0],
        },
      });
      const artist = await newArtist.save();
      res.status(200).json(artist);
    }
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// adding services to the artists
router.post("/add/:artistId/services", async (req, res) => {
  try {
    let services = req.body.services;
    let artist = await Artist.findOne({ _id: req.params.artistId });
    if (!artist) {
      let err = new Error("No such artist found!");
      err.code = 404;
      throw err;
    }
    let newServices = [];
    if (artist.services.length) {
      services.forEach((service) => {
        if (
          !artist.services.some(
            (obj) => obj.serviceId.toString() === service.serviceId
          )
        ) {
          newServices.push(service);
        }
      });
    } else {
      newServices = services;
    }

    let isSalonService = true;
    let servicePromiseArr = [];
    newServices.forEach((service) => {
      servicePromiseArr.push(Service.findOne({ _id: service.serviceId }));
    });
    let serviceArr = await Promise.all(servicePromiseArr);
    for (let service of serviceArr) {
      let index = serviceArr.indexOf(service);
      if (!service) {
        let err = new Error(
          `No such service (${
            newServices[serviceArr.indexOf(service)].serviceId
          })  exists!`
        );
        err.code = 404;
        throw err;
      }
      if (service.salonId.toString() !== artist.salonId.toString()) {
        isSalonService = false;
        break;
      }
      if (service.variables.length) {
        if (service.variables.length !== newServices[index].variables.length) {
          let err = new Error(`Invalid number of variables for the service!`);
          err.code = 400;
          throw err;
        }
        for (let variable of newServices[index].variables) {
          if (
            !service.variables.some(
              (obj) => obj._id.toString() === variable.variableId
            )
          ) {
            let err = new Error(
              `No such variable (${variable.variableId}) exists in the service!`
            );
            err.code = 404;
            throw err;
          }
        }
        newServices[index].price = newServices[index].variables.reduce((a, b) =>
          Math.min(a.price || a, b.price)
        );
      }
    }
    if (!isSalonService) {
      let err = new Error("This service is not listed at the artist's salon!");
      err.code = 400;
      throw err;
    }
    let data = [...artist.services, ...newServices];
    artist.services = data;
    await artist.save();
    res.status(200).json(wrapperMessage("success", "", artist));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/remove/:serviceId/services", async (req, res) => {
  try {
    let artistId = req.body.artistId;
    let artist = await Artist.findOne({ _id: artistId });
    if (!artist) {
      let err = new Error("No such artist found!");
      err.code = 404;
      throw err;
    }
    let serviceArr = artist.services.filter(
      (ele) => ele.serviceId.toString() !== req.params.serviceId
    );
    artist.services = serviceArr;
    await artist.save();
    res.json(wrapperMessage("success", "Service deleted successfully", artist));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

// Updating existing artist
router.post("/:id/update", async (req, res) => {
  try {
    let data = await Artist.updateOne({ _id: req.params.id }, req.body);
    res.json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
});

router.get("/single/:id", async (req, res) => {
  try {
    let data = await Artist.findOne({ _id: req.params.id });
    if (!data) {
      let err = new Error("No such artist found!");
      err.code = 404;
      throw err;
    }
    let salonData = await Salon.findOne({ _id: data.salonId });
    if (!salonData) {
      let err = new Error("This artist is associated with an unknown salon!");
      err.code = 404;
      throw err;
    }
    let discount = salonData.discount;
    let services = await CommonUtils.addDiscountToServices(discount, data.services);
    data.services = services;
    res.json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
});

router.post("/topArtists", async (req, res) => {
  try {
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
          live: true
        }
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
    res.status(200).json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.status(500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/filter", async (req, res) => {
  try {
    let filter = req.query.filter.toLowerCase();
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
          live: true
        }
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
      {
        $match: {
          rating: { $gte: Number(req.query.min) || 0 },
        },
      },
    ]);
    if (!artists.length) {
      res.status(200).json(wrapperMessage("success", "No result found!", []));
      return;
    }
    let maxDistance = 0;
    let end = 0;
    if (artists.length < 1000) {
      maxDistance = artists[artists.length - 1].distance;
      end = artists.length - 1;
    } else {
      maxDistance = artists[1000].distance;
      end = 1000;
    }

    if (filter === "rating") {
      let maxRating = 5;
      for (let itr = 0; itr <= end; itr++) {
        let artist = artists[itr];
        let score = 0;
        score =
          ((maxDistance - artist.distance) / maxDistance) * 0.4 +
          (artist.rating / maxRating) * 0.4;

        if (artist.paid) {
          score += 0.2;
        }

        artists[itr]["score"] = score;
      }
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
    res.status(200).json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

module.exports = router;
