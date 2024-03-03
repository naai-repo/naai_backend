const cron = require('node-cron');
const mongoose = require('mongoose');
const Booking = require('../model/partnerApp/Booking'); // Assuming your Booking model is defined in a separate file


console.log('hi from cron')
const url = `mongodb+srv://naaiadmn:naaiadmn@cluster0.rg1ncj1.mongodb.net/naai`;

  mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
 }).then(r =>{
    console.log('cnt')
 })

cron.schedule('*/10 * * * *', async () => {
   
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    try {
     
        const bookingsToUpdate = await Booking.find({
            bookingDate: { $gte: tenMinutesAgo },
            // bookingStatus: { $ne: "completed" } iffneed be
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
