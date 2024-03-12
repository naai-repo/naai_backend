const cron = require('node-cron');
const mongoose = require('mongoose');
const Booking = require('../model/partnerApp/Booking'); // Assuming your Booking model is defined in a separate file
const Salon = require('../model/partnerApp/Salon');
const CommonUtils = require('./commonUtils');


console.log('hi from cron')
const url = `mongodb+srv://naaiadmn:naaiadmn@cluster0.rg1ncj1.mongodb.net/naai`;

  mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
 }).then(r =>{
    console.log('cnt')
 })

cron.schedule('*/10 * * * *', async () => {
   

    try {
     
        const currentTime = new Date();
        const startTime = new Date(currentTime.getTime() - 10 * 60 * 1000); 
        const endTime = currentTime;

        // Find bookings within the specified time frame
        const bookingsToUpdate = await Booking.find({
            bookingDate: { $gte: startTime, $lt: endTime }, 
            bookingStatus: { $ne: "completed" } 
        });


           console.log('klklkl');
        await Promise.all(bookingsToUpdate.map(booking => {
            console.log(booking)
            booking.bookingStatus = "in-progress";
            return booking.save();
        }));

        console.log(`Updated ${bookingsToUpdate.length} bookings to "in-progress"`);
    } catch (error) {
        console.error(error);
    }
});

cron.schedule('0 0 * * *', async () => {
    try {
        const currentTime = new Date().toISOString();
        console.log('Current Time', currentTime);

        // Find discounts that have endDate of currentTime or less than currentTime
        const discountsToUpdate = await Salon.find({
            $and: [
                { "discountTime.end": { $lte: currentTime } },
                { "discountTime.end": { $ne: "" } }
            ]
        });
        let salonIdArr = discountsToUpdate.map(salon => salon._id);
        await Promise.all(discountsToUpdate.map(salon => {
            salon.discount = 0;
            salon.discountTime = { start: "", end: "" };
            return salon.save();
        }));
        await Promise.all(salonIdArr.map(salonId => {
            return CommonUtils.updateDiscountedServicePrice(salonId, 0);
        }));
        console.log(`${discountsToUpdate.length} Salon Discounts ended!`);
    } catch (error) {
        console.error(error);
    }   
});