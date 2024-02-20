const Booking = require("../model/partnerApp/Booking");
const Salon = require("../model/partnerApp/Salon");
const Service = require("../model/partnerApp/Service");
const Artist = require("../model/partnerApp/Artist");

const permutations = (arr) => {
  arr = arr.filter((element) => element.artist !== "000000000000000000000000");
  if (arr.length <= 2)
    return arr.length === 2 ? [arr, [arr[1], arr[0]]] : [arr];
  return arr.reduce(
    (acc, item, i) =>
      acc.concat(
        permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map((val) => [
          item,
          ...val,
        ])
      ),
    []
  );
};

const getSalonSlots = (salonId) => {
  return new Promise(async function (resolve, reject) {
    try {
      let { salonOpeningTime, salonClosingTime } = await getSalonTimings(
        salonId
      );
      let length = 0;
      let opening = salonOpeningTime.split(":");
      let closing = salonClosingTime.split(":");
      if (opening[1] === "30") {
        length++;
        opening[0]++;
      }
      if (closing[1] === "30") {
        length++;
      }

      length += (closing[0] - opening[0]) * 2;
      resolve(length);
    } catch (err) {
      reject(err);
    }
  });
};

const getWindowSize = (requests, salonId) => {
  return new Promise(async function (resolve, reject) {
    try {
      let size = 0;
      let servicePromiseArr = [];
      requests.forEach((request) => {
        if (request.artist !== "000000000000000000000000") {
          servicePromiseArr.push(Service.findOne({ _id: request.service }));
        }
      });
      let serviceArr = await Promise.all(servicePromiseArr);
      serviceArr.forEach((service) => {
        if (!service) {
          throw new Error("Service not found! Please check all services.");
        }
        let data = service.salonId.toString() === salonId;
        if (!data)
          throw new Error("Service is not Supported by the selected Salon!");
        let index = requests.findIndex(
          (ele) => ele.service === service._id.toString()
        );
        requests[index].service = service;
      });
      for (let request of requests) {
        if (request.artist !== "000000000000000000000000") {
          if ("variable" in request) {
            request.time = request.variable.variableTime;
            size += request.variable.variableTime;
          } else {
            request.time = request.service.avgTime;
            size += request.service.avgTime;
          }
        }
      }
      resolve({ request: requests, windowSize: size });
    } catch (err) {
      reject(err);
    }
  });
};

const getArtistsFreeSlots = (
  artistBookings,
  salonSlotsLength,
  salonOpening,
  salonClosing
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let artistsFreeSlots = {};
      let artistsPromiseArr = [];
      Object.keys(artistBookings).forEach((artist) => {
        if (artist !== "000000000000000000000000") {
          artistsFreeSlots[artist] = Array(salonSlotsLength).fill(0);
          artistsPromiseArr.push(Artist.find({ _id: artist }));
        }
      });
      let artistsDataArr = await Promise.all(artistsPromiseArr);
      artistsDataArr.forEach((artistData) => {
        let artist = artistData[0]._id;
        if (!artistData.length) {
          throw new Error("Artist with this id does not exist");
        }
        artistData = artistData[0];
        if (artistData.availability) {
          let artistStartTime = artistData.timing.start.split(":");
          let artistEndTime = artistData.timing.end.split(":");
          let startPointer =
            (Number(artistStartTime[0]) - Number(salonOpening[0])) * 2;
          let endPointer =
            (Number(artistEndTime[0]) - Number(salonOpening[0])) * 2;

          if (artistStartTime[1] === "30") {
            startPointer += 1;
          }
          if (artistEndTime[1] === "30") {
            endPointer += 1;
          }
          if (salonOpening[1] === "30") {
            startPointer -= 1;
            endPointer -= 1;
          }
          for (let itr = startPointer; itr < endPointer; itr++) {
            artistsFreeSlots[artist][itr] = 1;
          }
        } else {
          throw new Error("Artist is not Available, Select some other Artist!");
        }
        if (artistBookings[artist].length) {
          artistBookings[artist].forEach((booking) => {
            let bookingArr = booking.artistServiceMap.filter(
              (obj) => obj.artistId.toString() === artist.toString()
            );
            bookingArr.forEach((booking) => {
              let startTime = booking.timeSlot.start.split(":");
              let endTime = booking.timeSlot.end.split(":");
              let startPtr =
                (Number(startTime[0]) - Number(salonOpening[0])) * 2;
              let endPtr = (Number(endTime[0]) - Number(salonOpening[0])) * 2;
              if (startTime[1] === "30") {
                startPtr += 1;
              }
              if (endTime[1] === "30") {
                endPtr += 1;
              }
              if (salonOpening[1] === "30") {
                startPtr -= 1;
                endPtr -= 1;
              }
              for (let itr = startPtr; itr < endPtr; itr++) {
                artistsFreeSlots[artist][itr] = 0;
              }
            });
          });
        }
      });
      resolve(artistsFreeSlots);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

const getTimeSlotsOfArtists = (requests, salonSlotsLength, salonId, date) => {
  return new Promise(async (resolve, reject) => {
    try {
      let { salonOpeningTime, salonClosingTime } = await getSalonTimings(
        salonId
      );
      let salonOpenTime = salonOpeningTime.split(":");
      let salonCloseTime = salonClosingTime.split(":");
      let artistPromiseArr = [];
      requests.forEach((request) => {
        let artist = request.artist;
        artistPromiseArr.push(
          Booking.find({
            salonId: salonId,
            bookingDate: date,
            artistServiceMap: { $elemMatch: { artistId: artist } },
          })
        );
      });
      let data = await Promise.all(artistPromiseArr);
      let artistBookings = {};
      for (let i = 0; i < requests.length; i++) {
        artistBookings[requests[i].artist] = [];
      }
      for (let i = 0; i < data.length; i++) {
        artistBookings[requests[i].artist] = [
          ...artistBookings[requests[i].artist],
          ...data[i],
        ];
      }
      let artistsFreeSlots = await getArtistsFreeSlots(
        artistBookings,
        salonSlotsLength,
        salonOpenTime,
        salonCloseTime
      );
      resolve({
        artistsTimeSlots: artistsFreeSlots,
        salonOpenTime,
        salonCloseTime,
      });
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

const bookingHelper = (perm, ws, freeTime, salonSlotsLength, key) => {
  let left = 0,
    right = ws - 1;
  let ans = [];
  while (right < salonSlotsLength) {
    let start = left;
    let flag = true;
    perm.forEach((item) => {
      let artist = item.artist;
      let time = item.time;
      while (time--) {
        if (!freeTime[artist][start++]) {
          flag = false;
          break;
        }
      }
    });
    if (flag) {
      let obj = {
        slot: [left, right],
        key,
      };
      ans.push(obj);
    }
    left++;
    right++;
  }
  return ans;
};

const getSalonTimings = (salonId) => {
  return new Promise(async (resolve, reject) => {
    try {
      let salonData = await Salon.find({ _id: salonId });
      if (!salonData.length) {
        throw new Error("Salon Id not valid or no such Salon exists!");
      }
      let salonOpeningTime = salonData[0].timing.opening;
      let salonClosingTime = salonData[0].timing.closing;

      resolve({ salonOpeningTime, salonClosingTime });
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

const updateBookingData = (salonId, artistArr) => {
  return new Promise(async (resolve, reject) => {
    try {
      let salonBookings = await Booking.find({ salonId: salonId }).count();
      let salonData = await Salon.updateOne(
        { _id: salonId },
        { bookings: salonBookings }
      );
      let artistPromiseArr = [];
      artistArr.forEach((artist) => {
        artistPromiseArr.push(
          Booking.find({
            artistServiceMap: { $elemMatch: { artistId: artist } },
          })
        );
      });
      artistPromiseArr = await Promise.all(artistPromiseArr);
      for (let itr = 0; itr < artistArr.length; itr++) {
        let artist = artistArr[itr];
        if (artist.toString() === "000000000000000000000000") {
          continue;
        }
        let artistBookings = artistPromiseArr[itr].length;
        let artistData = await Artist.updateOne(
          { _id: artist },
          { bookings: artistBookings }
        );
      }
      resolve();
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

const getArtistsForServices = (randomArr, salonId, date) => {
  return new Promise(async (resolve, reject) => {
    try {
      let artistPromiseArr = [];
      randomArr.forEach((element) => {
        artistPromiseArr.push(
          Artist.find({
            salonId: salonId,
            services: { $elemMatch: { serviceId: element.service } },
          })
        );
      });
      let artistArr = await Promise.all(artistPromiseArr);
      let uniqueArtistArr = new Set();
      for (let i = 0; i < artistArr.length; i++) {
        artistArr[i] = {
          service: randomArr[i].service,
          variable: randomArr[i].variable,
          time: randomArr[i].time,
          artists: artistArr[i].map((ele) => ele._id),
        };
        artistArr[i].artists.forEach((ele) =>
          uniqueArtistArr.add(ele.toString())
        );
      }
      uniqueArtistArr = Array.from(uniqueArtistArr);
      let bookingsPromiseArr = [];
      uniqueArtistArr.forEach((artist) => {
        bookingsPromiseArr.push(
          Booking.find({
            salonId: salonId,
            bookingDate: date,
            artistServiceMap: { $elemMatch: { artistId: artist } },
          })
        );
      });
      let data = await Promise.all(bookingsPromiseArr);
      let artistBookings = {};
      uniqueArtistArr.forEach((artist) => {
        artistBookings[artist] = [];
      });
      for (let i = 0; i < data.length; i++) {
        artistBookings[uniqueArtistArr[i]] = [
          ...artistBookings[uniqueArtistArr[i]],
          ...data[i],
        ];
      }
      let { salonOpeningTime, salonClosingTime } = await getSalonTimings(
        salonId
      );
      let salonOpenTime = salonOpeningTime.split(":");
      let salonCloseTime = salonClosingTime.split(":");
      let salonSlotsLength = await getSalonSlots(salonId);
      let artistsFreeSlots = await getArtistsFreeSlots(
        artistBookings,
        salonSlotsLength,
        salonOpenTime,
        salonCloseTime
      );
      resolve({ artistList: artistArr, artistsFreeSlots });
    } catch (err) {
      reject(err);
    }
  });
};

const fillRandomArtists = (
  artistList,
  artistsFreeSlots,
  salonId,
  endingTime
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let { salonOpeningTime, salonClosingTime } = await getSalonTimings(
        salonId
      );
      let salonOpenTime = salonOpeningTime.split(":");
      let salonCloseTime = salonClosingTime.split(":");
      endingTime = endingTime.split(":");
      let checkSlot = 0;
      if (salonOpenTime[1] === endingTime[1]) {
        checkSlot = (Number(endingTime[0]) - Number(salonOpenTime[0])) * 2;
      } else {
        checkSlot = (Number(endingTime[0]) - Number(salonOpenTime[0])) * 2;
        if (endingTime[1] === "30") {
          checkSlot += 1;
        } else if (endingTime[1] === "00") {
          checkSlot -= 1;
        }
      }
      let newArtistList = [];
      let ans = [];
      while (artistList.length !== newArtistList.length) {
        newArtistList = artistList;
        artistList = [];
        for (let i = 0; i < newArtistList.length; i++) {
          let slot = checkSlot;
          let artistFound = false;
          let artistArr = newArtistList[i].artists;
          for (let j = 0; j < artistArr.length; j++) {
            let artist = artistArr[j];
            let time = newArtistList[i].time;
            let hasFreeTime = true;
            while (time) {
              if (!artistsFreeSlots[artist][slot]) {
                hasFreeTime = false;
                break;
              }
              time--;
              slot++;
            }
            if (hasFreeTime) {
              artistFound = true;
              ans.push({
                service: newArtistList[i].service,
                artist: artist,
                checkSlot: checkSlot,
              });
              break;
            }
          }
          if (!artistFound) {
            artistList.push(newArtistList[i]);
          } else {
            checkSlot += newArtistList[i].time;
          }
        }
      }
      resolve({ artistList, ans });
    } catch (err) {
      reject(err);
    }
  });
};

const getBookingPrice = (booking) => {
  return new Promise(async (resolve, reject) => {
    try {
      let price = 0;
      let services = booking.artistServiceMap;
      let artistPromiseArr = [];
      for (let service of services) {
        artistPromiseArr.push(Artist.findOne({ _id: service.artistId }));
      }
      artistPromiseArr = await Promise.all(artistPromiseArr);
      for (let index in artistPromiseArr) {
        if (
          services[index].artistId.toString() === "000000000000000000000000"
        ) {
          services[index].servicePrice = 0;
          continue;
        }
        let artist = artistPromiseArr[index];
        if (!artist) {
          let err = new Error("Artist not found!");
          err.code = 404;
          throw err;
        }
        let service = artist.services.find(
          (ele) =>
            ele.serviceId.toString() === services[index].serviceId.toString()
        );
        if (!service) {
          let err = new Error("Service not found!");
          err.code = 404;
          throw err;
        }
        if ("variables" in service && service.variables.length > 0) {
          let variable = service.variables.find(
            (ele) =>
              ele.variableId.toString() === services[index].variable.variableId
          );
          if (!variable) {
            let err = new Error("Variable not found!");
            err.code = 404;
            throw err;
          }
          services[index].servicePrice = variable.price;
          price += variable.price;
        } else {
          services[index].servicePrice = service.price;
          price += service.price;
        }
      }
      let amount = price;
      resolve({ ...booking, amount: amount, paymentAmount: price });
    } catch (err) {
      reject(err);
    }
  });
};

const addTime = (time) => {
  if(time%2 === 0){
      return Math.floor((time/2))*60*60*1000;
  }else{
      return Math.floor((time/2))*60*60*1000 + 30*60*1000;
  }
}

module.exports = {
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
  addTime
};
