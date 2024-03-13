const router = require("express").Router();
const mongoose = require("mongoose");
const wrapperMessage = require("../../helper/wrapperMessage");
const {
  getSalonSlots,
  getWindowSize,
  getTimeSlotsOfArtists,
  permutations,
  bookingHelper,
  getSalonTimings,
  updateBookingData,
  getArtistsForServices,
  fillRandomArtists,
  getBookingPrice,
  addTime,
} = require("../../helper/bookingHelper");
const Booking = require("../../model/partnerApp/Booking");
const Artist = require("../../model/partnerApp/Artist");
const Product = require("../../model/partnerApp/inventory/product.model");
const User = require("../../model/customerApp/User");
const jwtVerify = require("../../middleware/jwtVerification");
const sendMail = require("../../helper/sendMail");
const Salon = require("../../model/partnerApp/Salon");
const sendMessageToUser = require("../../helper/sendMessageToUser");
const Service = require("../../model/partnerApp/Service");
const { scheduleJobToChangeBookingStatus } = require("../../helper/scheduler");

/* 
    BODY FOR SCHEDULING WILL CONTAIN

    salonId,
    map of services and artists for those services,
    date in MM-DD-YYYY format

*/
router.post("/singleArtist/list", async (req, res) => {
  try {
    const set = new Set();
    let { salonId, services } = req.body;
    let artistPromiseArr = [];
    services.forEach((service) => {
      artistPromiseArr.push(
        Artist.find({
          salonId: salonId,
          services: { $elemMatch: { serviceId: service } },
        })
      );
    });
    let artistLists = await Promise.all(artistPromiseArr);
    artistLists = artistLists.reduce((prev, next) => prev.concat(next));
    let artistsProvidingServices = artistLists.filter((element) => {
      if (set.has(element._id.toString())) return false;
      set.add(element._id.toString());
      return true;
    });
    artistsProvidingServices = artistsProvidingServices.map((ele) => {
      return {
        artistId: ele._id,
        artist: ele.name,
        serviceList: ele.services,
        rating: ele.rating,
      };
    });
    res.status(200).json({ artistsProvidingServices, services });
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/singleArtist/request", async (req, res) => {
  try {
    let { services, artist } = req.body;
    let servicePromiseArr = [];
    services.forEach((service) => {
      servicePromiseArr.push(Service.findOne({ _id: service.serviceId }));
    });
    let serviceArr = await Promise.all(servicePromiseArr);
    for (let service of serviceArr) {
      let index = serviceArr.indexOf(service);
      if (!service) {
        let err = new Error("No such service found!");
        err.code = 404;
        throw err;
      }
      if (service.variables.length) {
        let variable = service.variables.filter(
          (ele) => ele._id.toString() === services[index].variableId
        );
        if (!variable.length) {
          let err = new Error("No such variable found!");
          err.code = 404;
          throw err;
        } else {
          services[index].variable = variable[0];
          delete services[index].variableId;
        }
      }
    }
    let requests = [];
    services.forEach((service) => {
      let val = artist.serviceList.filter(
        (ele) => ele.serviceId === service.serviceId
      );
      if (!val.length) {
        requests.push({
          service: service.serviceId,
          variable: service.variable,
          artist: "000000000000000000000000",
        });
      } else {
        requests.push({
          service: service.serviceId,
          variable: service.variable,
          artist: artist.artistId,
        });
      }
    });
    let artistNumber = 0;
    requests.forEach((request) => {
      if (request.artist !== "000000000000000000000000") {
        artistNumber++;
      }
    });
    if (!artistNumber) {
      let err = new Error("No artist available for the selected services!");
      err.code = 404;
      throw err;
    }
    res.status(200).json({ requests });
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/schedule", jwtVerify, async (req, res) => {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 10;
    let skip = (page - 1) * limit;
    let { salonId, requests, date } = req.body;
    if (
      new Date(new Date(date).toDateString()) <
      new Date(new Date().toDateString())
    ) {
      let err = new Error("Select a Valid Date!");
      err.code = 400;
      throw err;
    }
    let requestSet = new Set();
    requests.forEach((request) => requestSet.add(request.artist));
    let uniqueArtists = Array.from(requestSet);
    let newRequests = [];
    uniqueArtists.forEach((artist) => {
      requests.forEach((request) => {
        if (artist === request.artist) {
          newRequests.push(request);
        }
      });
    });
    let salonSlotsLength = await getSalonSlots(salonId);
    let { request, windowSize } = await getWindowSize(
      newRequests,
      salonId,
      res
    );
    let { artistsTimeSlots, salonOpenTime } = await getTimeSlotsOfArtists(
      newRequests,
      salonSlotsLength,
      salonId,
      new Date(date)
    );
    let perms = permutations(request);
    let randomArtistService = newRequests.filter(
      (element) => element.artist === "000000000000000000000000"
    );
    for (let service of randomArtistService) {
      let serviceData = await Service.findOne({ _id: service.service });
      service.service = serviceData;
      if ("variable" in service) {
        service.time = service.variable.variableTime;
      } else {
        service.time = service.service.avgTime;
      }
    }
    let timeSlots = [];
    const set = new Set();

    perms.forEach((item, index) => {
      let timeSlot = bookingHelper(
        item,
        windowSize,
        artistsTimeSlots,
        salonSlotsLength,
        index + 1
      );

      if (timeSlot.length) {
        for (let itr = 0; itr < timeSlot.length; itr++) {
          let slot = timeSlot[itr];
          slot = slot.slot;
          let startTime = slot[0];
          let endTime = slot[1] + 1;
          if (salonOpenTime[1] === "00") {
            if (startTime % 2 === 0) {
              startTime = `${startTime / 2 + Number(salonOpenTime[0])}:00`;
            } else {
              startTime = `${
                (startTime - 1) / 2 + Number(salonOpenTime[0])
              }:30`;
            }
            if (endTime % 2 === 0) {
              endTime = `${endTime / 2 + Number(salonOpenTime[0])}:00`;
            } else {
              endTime = `${(endTime - 1) / 2 + Number(salonOpenTime[0])}:30`;
            }
          } else {
            if (startTime % 2 === 0) {
              startTime = `${startTime / 2 + Number(salonOpenTime[0])}:30`;
            } else {
              startTime = `${
                (startTime + 1) / 2 + Number(salonOpenTime[0])
              }:00`;
            }
            if (endTime % 2 === 0) {
              endTime = `${endTime / 2 + Number(salonOpenTime[0])}:30`;
            } else {
              endTime = `${(endTime + 1) / 2 + Number(salonOpenTime[0])}:00`;
            }
          }
          timeSlot[itr].slot = [startTime, endTime];
          set.add(timeSlot[itr].slot.toString());
        }
        item = item.concat(randomArtistService);
        timeSlots.push({
          key: index + 1,
          possible: true,
          timeSlot,
          order: item,
        });
      } else {
        timeSlots.push({ key: index + 1, possible: false });
      }
    });
    let timeSlotsVisible = Array.from(set);
    timeSlotsVisible = Array.from(
      timeSlotsVisible.map((ele) => ele.split(","))
    );
    timeSlots = timeSlots.filter((obj) => obj.possible !== false);
    let data = [];
    for (let itr = skip; itr < skip + limit; itr++) {
      if (!timeSlots[itr]) {
        break;
      }
      data.push(timeSlots[itr]);
    }
    res.json({ salonId, timeSlots: data, artistsTimeSlots, timeSlotsVisible });
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/book", jwtVerify, async (req, res) => {
  try {
    let userId = req.user.id;
    let { timeSlots, salonId, bookingDate, key, timeSlot } = req.body;
    let date = bookingDate.split("-");
    let time = timeSlot[0].split(":");
    let data = {
      salonId: salonId,
      userId: userId,
      paymentId: "12345",
      paymentStatus: "pending",
      bookingStatus: "pending",
      bookingDate: new Date(
        date[2],
        Number(date[0]) - 1,
        date[1],
        time[0],
        time[1]
      ),
    };
    let artistServiceMap = [];
    let timeSlotOrder = timeSlots.filter((timeSlot) => timeSlot.key === key);
    let doesTimeSlotExists = timeSlotOrder[0].timeSlot.filter(
      (slot) => slot.slot.toString() === timeSlot.toString()
    );
    if (!doesTimeSlotExists.length) {
      throw new Error("No such time slot exists for this order of services!");
    }
    timeSlotOrder = timeSlotOrder[0].order;
    let randomArr = [];
    let artistSet = new Set();
    timeSlotOrder.forEach((object) => {
      if (object.artist !== "000000000000000000000000") {
        artistSet.add(object.artist.toString());
      } else if (object.artist === "000000000000000000000000") {
        randomArr.push(object);
      }
    });

    // Get artists for the randomly assigned services
    let { artistList, artistsFreeSlots } = await getArtistsForServices(
      randomArr,
      salonId,
      bookingDate
    );
    // Fills the random services with appropriate artists
    let testdata = await fillRandomArtists(
      artistList,
      artistsFreeSlots,
      salonId,
      timeSlot[1]
    );
    for (let i = 0; i < timeSlotOrder.length; i++) {
      for (let j = 0; j < testdata.ans.length; j++) {
        if (
          timeSlotOrder[i].service._id.toString() ===
          testdata.ans[j].service._id.toString()
        ) {
          timeSlotOrder[i].service = testdata.ans[j].service;
          timeSlotOrder[i].artist = testdata.ans[j].artist;
        }
      }
    }
    let lastTime = timeSlot[0];
    let randomServices = randomArr.map((obj) => obj.service?._id?.toString());
    let totalTime = 0;
    timeSlotOrder.forEach((object) => {
      if (object.artist === "000000000000000000000000") {
        let obj = {
          serviceId: object.service._id,
          artistId: object.artist,
          variable: {
            variableId: object.variable?._id || "none",
            variableType: object.variable?.variableType || "none",
            variableName: object.variable?.variableName || "none",
          },
          chosenBy: "algo",
          timeSlot: {
            start: "00:00",
            end: "00:00",
          },
        };
        artistServiceMap.push(obj);
        return;
      }

      let obj = {
        serviceId: object.service._id,
        artistId: object.artist,
      };
      if (randomServices.includes(obj.serviceId.toString())) {
        obj.chosenBy = "algo";
      } else {
        obj.chosenBy = "user";
      }
      let time = object.time;
      totalTime += time;
      let startTime = lastTime.split(":");
      let endTime = "";
      if (startTime[1] === "00") {
        if (time % 2 === 0) {
          endTime = `${parseInt(time / 2) + Number(startTime[0])}:00`;
        } else {
          endTime = `${parseInt(time / 2) + Number(startTime[0])}:30`;
        }
      } else {
        if (time % 2 === 0) {
          endTime = `${parseInt(time / 2) + Number(startTime[0])}:30`;
        } else {
          endTime = `${parseInt(time / 2) + Number(startTime[0]) + 1}:00`;
        }
      }
      obj = {
        ...obj,
        variable: {
          variableId: object.variable?._id || "none",
          variableType: object.variable?.variableType || "none",
          variableName: object.variable?.variableName || "none",
        },
        timeSlot: {
          start: lastTime,
          end: endTime,
        },
      };
      artistServiceMap.push(obj);
      lastTime = endTime;
    });
    data = {
      ...data,
      timeSlot: {
        start: timeSlot[0],
        end: lastTime,
      },
      bookingType: Array.from(artistSet).length === 1 ? "single" : "multiple",
      artistServiceMap,
    };
    res.status(200).json({ booking: data, totalTime: totalTime });
  } catch (err) {
    console.log(err);
    res.json(wrapperMessage("failed", err.message));
  }
});

router.post("/confirm", jwtVerify, async (req, res) => {
  try {
    let data = req.body.booking;
    data = await getBookingPrice(data)
    let totalTime = req.body.totalTime;
    let userId = req.user.id;
    let newBooking = new Booking(data);
    const booking = await newBooking.save();
    const user = await User.findOne({ _id: userId });
    const salon = await Salon.findOne({ _id: booking.salonId });
    const timeOptions = {
      hour12: true,
      hour: "numeric",
      minute: "numeric",
    };
    const dateOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const message = `
    Your booking with id ${booking._id} has been successfully placed at ${
      salon.name
    }.
    Please reach the salon on ${new Date(booking.bookingDate).toLocaleString(
      "en-GB",
      dateOptions
    )} at
    ${new Date("1970-01-01T" + booking.timeSlot.start).toLocaleString(
      "en-GB",
      timeOptions
    )}`;

    const createHtml = (booking, user, salon) => {
      return new Promise(async (resolve, reject) => {
        try {
          const dateOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          };
          let artistPromiseArr = [];
          let servicePromiseArr = [];
          booking.artistServiceMap.forEach((ele) => {
            artistPromiseArr.push(Artist.findOne({ _id: ele.artistId }));
            servicePromiseArr.push(Service.findOne({ _id: ele.serviceId }));
          });
          let artistList = await Promise.all(artistPromiseArr);
          let serviceList = await Promise.all(servicePromiseArr);
          let serviceMap = booking.artistServiceMap.map((obj, index) => {
            return `
                <p>Service Id : ${obj.serviceId}</p>
                <p>Service Name : ${serviceList[index].serviceTitle}</p>
                <p>Variable Type : ${obj.variable.variableType}</p>
                <p>Variable Name: ${obj.variable.variableName}</p>
                <p>Artist Id : ${obj.artistId}</p>
                <p>Artist Name : ${artistList[index].name}</p>
                <p>Timeslot : ${obj.timeSlot.start} - ${obj.timeSlot.end}</p>
                <p>Service Price (Discounted) : ${obj.servicePrice}</p>
                <p>Service Price (Original) : ${obj.serviceCutPrice}</p>
            `;
          });
          let servicesData = serviceMap.join("&ensp;");
          resolve(
            `
              <div>
                  <h1>Booking Details</h1>
                  <p>Booking Id: ${booking._id}</p>
                  <p>Booking Type: ${booking.bookingType}</p>
                  <p>Booking Date: ${new Date(
                    booking.bookingDate
                  ).toLocaleString("en-GB", dateOptions)}</p>
                  <p>Booking Time: ${booking.timeSlot.start}</p>
                  <p>Booking Payment Status: ${booking.paymentStatus}</p>
                  <p>Booking Amount (Discounted): ${booking.paymentAmount}</p>
                  <p>Booking Amount (Original): ${booking.amount}</p>
                  <p>User Name: ${user.name}</p>
                  <p>User Id: ${user._id}</p>
                  <p>User Phonenumber: ${user.phoneNumber}</p>
                  <p>Salon Name: ${salon.name}</p>
                  <p>Salon Phonenumber: ${salon.phoneNumber}</p>
                  <h2>Services Taken: </h2>
                  &ensp;${servicesData}
              </div>
              `
          );
        } catch (err) {
          console.log(err);
          reject(err);
        }
      });
    };
    let htmlData = await createHtml(booking, user, salon);
    sendMail(
      htmlData,
      "naai.admn@gmail.com",
      "booking confirmed",
      "booking confirmed"
    );
    //     sendMessageToUser(user, message);
    let artistArr = new Set(
      booking.artistServiceMap.map((ele) => ele.artistId)
    );
    artistArr = Array.from(artistArr);
    await updateBookingData(booking.salonId, artistArr);
    let startDate = booking.bookingDate;
    let endDate = new Date(startDate).getTime() + addTime(totalTime);
    endDate = new Date(endDate);
    await scheduleJobToChangeBookingStatus(startDate, booking, "in-progress");
    scheduleJobToChangeBookingStatus(endDate, booking, "completed")
      .then(async (b) => {
        let serviceIds = b.artistServiceMap.map((o) => o.serviceId.toString());
        await updateInventoryOnServiceCompletion(serviceIds);
      })
      .catch((err) => {
        if (err) {
          res
            .status(err.code || 500)
            .json(wrapperMessage("error in product updation", err.message));
        }
      });
    res.json(wrapperMessage("success", "Booking Confirmed!", booking));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/delete", jwtVerify, async (req, res) => {
  try {
    let userId = req.user.id;
    let bookingId = req.body.bookingId;
    if (!bookingId) {
      let err = new Error("Booking Id is required!");
      err.code = 400;
      throw err;
    }
    let booking = await Booking.findOne({ _id: bookingId });
    let artistArr = new Set(
      booking.artistServiceMap.map((ele) => ele.artistId)
    );
    let salonId = booking.salonId;
    artistArr = Array.from(artistArr);
    if (!booking) {
      let err = new Error("No such Booking found!");
      err.code = 404;
      throw err;
    }
    if (booking.userId.toString() !== userId.toString()) {
      let err = new Error("You are not authorized to delete this booking!");
      err.code = 403;
      throw err;
    }

    let data = await Booking.deleteOne({ _id: bookingId });
    await updateBookingData(salonId, artistArr);
    res.status(200).json(wrapperMessage("success", "", data));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/bookAgain", jwtVerify, async (req, res) => {
  try {
    let userId = req.user.id;
    let bookingId = req.body.bookingId;
    if (!bookingId) {
      let err = new Error("Booking Id is required!");
      err.code = 400;
      throw err;
    }
    let booking = await Booking.findOne({ _id: bookingId });
    if (!booking) {
      let err = new Error("No such Booking found!");
      err.code = 404;
      throw err;
    }
    if (userId.toString() !== booking.userId.toString()) {
      let err = new Error("You are not authorized to book this booking again!");
      err.code = 403;
      throw err;
    }
    let requests = [];
    booking.artistServiceMap.forEach((element) => {
      let obj = {
        service: element.serviceId,
        artist: element.artistId,
      };
      if (element.variable.variableId !== "none") {
        obj.variable = element.variable.variableId;
      }
      requests.push(obj);
    });
    for (let request of requests) {
      if ("variable" in request) {
        let variable = await Service.findOne({
          _id: request.service,
          variables: { $elemMatch: { _id: request.variable } },
        });
        if (!variable) {
          let err = new Error("No such variable found!");
          err.code = 404;
          throw err;
        }
        request.variable = variable.variables.filter(
          (ele) => ele._id.toString() === request.variable
        )[0];
      }
    }
    res
      .status(200)
      .json(
        wrapperMessage("success", "", { salonId: booking.salonId, requests })
      );
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.get("/user/bookings", jwtVerify, async (req, res) => {
  try {
    let userId = req.user.id;
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 3;
    let skip = (page - 1) * limit;
    let date = new Date();
    let dd = String(date.getDate()).padStart(2, "0");
    let mm = String(date.getMonth() + 1).padStart(2, "0");
    let yyyy = date.getFullYear();
    date = new Date(`${mm}-${dd}-${yyyy}`);
    let current_bookings = await Booking.find({
      userId: userId,
      bookingStatus: "in-progress",
    });
    let previous_bookings = await Booking.find({
      userId: userId,
      bookingStatus: "completed",
    }).sort({ bookingDate: -1 });
    let upcoming_bookings = await Booking.find({
      userId: userId,
      bookingStatus: "pending",
    }).sort({ bookingDate: 1 });
    let prev_booking = [];
    for (let itr = skip; itr < skip + limit; itr++) {
      if (!previous_bookings[itr]) {
        break;
      }
      prev_booking.push(previous_bookings[itr]);
    }
    let coming_bookings = [];
    for (let itr = skip; itr < skip + limit; itr++) {
      if (!upcoming_bookings[itr]) {
        break;
      }
      coming_bookings.push(upcoming_bookings[itr]);
    }
    res
      .status(200)
      .json({ userId, current_bookings, prev_booking, coming_bookings });
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

router.post("/status", async (req, res) => {
  try {
    let bookingId = req.body.bookingId;
    if (!bookingId) {
      let err = new Error("Booking Id is required!");
      err.code = 400;
      throw err;
    }
    let booking = await Booking.findOne({ _id: bookingId });
    if (!booking) {
      let err = new Error("No such Booking found!");
      err.code = 404;
      throw err;
    }
    booking.bookingStatus = req.body.status;
    let data = await booking.save();
    res
      .status(200)
      .json(wrapperMessage("success", "Booking Status Changed!", data));
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
});

async function updateInventoryOnServiceCompletion(serviceIds) {
  try {
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      console.log("No service IDs provided.");
      return;
    }

    const services = await Service.find({ _id: { $in: serviceIds } }).populate(
      "productsUsed.product"
    );

    if (services.length === 0) {
      console.log("No services found.");
      return;
    }

    for (const service of services) {
      if (!service.productsUsed || service.productsUsed.length === 0) {
        console.log(`No products used in service ${service._id}.`);
        continue;
      }

      // Iterate over the products used in the service
      for (const productUsage of service.productsUsed) {
        const productId = productUsage.product._id;
        const usageQuantity = productUsage.usagePerService;
        const productName = productUsage.product.name;

        if (!productId) {
          console.log(
            `Invalid product ID for product ${productName} in service ${service._id}.`
          );
          continue;
        }

        const inventoryItem = await Product.findOne({ _id: productId });
        if (inventoryItem) {
          if (inventoryItem.totalQuantity >= usageQuantity) {
            inventoryItem.totalQuantity -= usageQuantity;
            await inventoryItem.save();
            console.log(
              `Deducted ${usageQuantity} ${productName} from inventory for service ${service._id}.`
            );
          } else {
            console.log(
              `Insufficient quantity of ${productName} in inventory for service ${service._id}.`
            );
          }
        } else {
          console.log(
            `Inventory not found for product ${productName} in service ${service._id}.`
          );
        }
      }

      console.log(`Service ${service._id} completed successfully.`);
    }
  } catch (error) {
    console.error("Error completing services:", error);
  }
}

module.exports = router;
