const router = require('express').Router();
const mongoose = require('mongoose');
const wrapperMessage = require('../../helper/wrapperMessage');
const Salon = require('../../model/partnerApp/Salon');
const { getSalonSlots, getWindowSize, getTimeSlotsOfArtists, permutations, bookingHelper, getSalonTimings } = require('../../helper/bookingHelper');
const Booking = require('../../model/partnerApp/Booking');

/* 
    BODY FOR SCHEDULING WILL CONTAIN

    salonId,
    map of services and artists for those services,
    date in MM-DD-YYYY format

*/
router.post('/schedule', async (req, res) => {
    try{
        let {salonId, requests, date} = req.body;
        let salonSlotsLength = await getSalonSlots(salonId, res);
        let {request, windowSize} = await getWindowSize(requests, salonId, res);
        let {artistsTimeSlots, salonOpenTime} = await getTimeSlotsOfArtists(requests, salonSlotsLength, salonId, new Date(date));
        let perms = permutations(request);
        let timeSlots = [];

        perms.forEach((item, index) => {
            let timeSlot = bookingHelper(item, windowSize, artistsTimeSlots, salonSlotsLength);
            
            if(timeSlot.length){
                for(let itr = 0; itr < timeSlot.length; itr++){
                    let slot = timeSlot[itr];
                    slot=slot.slot;
                    let startTime = slot[0];
                    let endTime = slot[1] + 1;
                    if(salonOpenTime[1] === "00"){
                        if(startTime%2 === 0){
                            startTime = `${(startTime/2) + Number(salonOpenTime[0])}:00`;
                        }else{
                            startTime = `${(startTime-1)/2 + Number(salonOpenTime[0])}:30`;
                        }
                        if(endTime%2 === 0){
                            endTime = `${(endTime/2) + Number(salonOpenTime[0])}:00`;
                        }else{
                            endTime = `${(endTime-1)/2 + Number(salonOpenTime[0])}:30`;
                        }
                    }else{
                        if(startTime%2 === 0){
                            startTime = `${(startTime/2) + Number(salonOpenTime[0])}:30`;
                        }else{
                            startTime = `${(startTime+1)/2 + Number(salonOpenTime[0])}:00`;
                        }
                        if(endTime%2 === 0){
                            endTime = `${(endTime/2) + Number(salonOpenTime[0])}:30`;
                        }else{
                            endTime = `${(endTime+1)/2 + Number(salonOpenTime[0])}:00`;
                        }
                    }
                    timeSlot[itr].slot = [startTime, endTime];
                }
                timeSlots.push({key: index+1, timeSlot, order: item})
            }else{
                timeSlots.push("NotPossible");
            }
        })
        res.json({salonId, timeSlots, artistsTimeSlots});

    }catch(err) {
        console.log(err);
        res.json(wrapperMessage("failed", err.message));
    }
})

router.post('/book', async (req,res) => {
    try{
        let {timeSlots, salonId, bookingDate, key, timeSlot, userId, paymentStatus, paymentId} = req.body;
        let data = {
            salonId: salonId,
            userId: userId,
            paymentId: paymentId,
            paymentStatus: paymentStatus,
            timeSlot: {
                start: timeSlot[0],
                end: timeSlot[1]
            },
            bookingDate: bookingDate
        }
        let artistServiceMap = [];
        let timeSlotOrder = timeSlots.filter(timeSlot => timeSlot.key === key);
        let doesTimeSlotExists = timeSlotOrder[0].timeSlot.filter(slot => slot.slot.toString() === timeSlot.toString());
        if(!doesTimeSlotExists.length){
            throw new Error("No such time slot exists for this order of services!");
        }
        timeSlotOrder = timeSlotOrder[0].order;
        let lastTime = timeSlot[0];
        timeSlotOrder.forEach(object => {
            let obj ={
                serviceId: object.service._id,
                artistId: object.artist
            };
            let service = object.service;
            let startTime = lastTime.split(":");
            let endTime = ""
            if(startTime[1] === "00"){
                if(service.avgTime%2 === 0){
                    endTime = `${parseInt(service.avgTime/2) + Number(startTime[0])}:00`;
                }else{
                    endTime = `${parseInt(service.avgTime/2) + Number(startTime[0])}:30`;
                }
            }else{
                if(service.avgTime%2 === 0){
                    endTime = `${parseInt(service.avgTime/2) + Number(startTime[0])}:30`;
                }else{
                    endTime = `${parseInt(service.avgTime/2) + Number(startTime[0])+1}:00`;
                }
            }
            obj = {
                ...obj,
                timeSlot: {
                    start: lastTime,
                    end: endTime
                }
            }
            artistServiceMap.push(obj);
            lastTime = endTime;
        })
        data = {
            ...data,
            artistServiceMap
        }
        let newBooking = new Booking(data);
        const booking = await newBooking.save();
        res.status(200).json(booking);

    }catch(err){
        console.log(err);
        res.json(wrapperMessage("failed", err.message));
    }
})

module.exports = router;