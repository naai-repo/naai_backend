const schedule = require("node-schedule");
const Booking = require("../model/partnerApp/Booking");

const scheduleJobToChangeBookingStatus = (date, booking, status) => {
  return new Promise((resolve, reject) => {
    try {
      schedule.scheduleJob(date, async () => {
        let bookingDate = await Booking.findOne({ _id: booking._id });
        if (!bookingDate) {
          reject("Booking not found");
        }
        bookingDate.bookingStatus = status;
        await bookingDate.save();
        console.log(
          `Booking (${bookingDate._id})  status changed to ${status}`
        );
      });
      resolve(booking);
    } catch (err) {
      reject(err);
    }
  });
};

const testing = (time) => {
  return new Promise((resolve, reject) => {
    try {
      schedule.scheduleJob(time, async () => {
        console.log("Testing");
      });
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  scheduleJobToChangeBookingStatus,
  testing
};
