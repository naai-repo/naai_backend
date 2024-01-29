const router = require('express').Router();
const mongoose = require('mongoose');
const wrapperMessage = require('../../helper/wrapperMessage');
const { getSalonSlots, getWindowSize, getTimeSlotsOfArtists, permutations, bookingHelper, getSalonTimings, updateBookingData, getArtistsForServices, fillRandomArtists } = require('../../helper/bookingHelper');
const Booking = require('../../model/partnerApp/Booking');
const Artist = require('../../model/partnerApp/Artist');
const jwtVerify = require('../../middleware/jwtVerification');

/* 
    BODY FOR SCHEDULING WILL CONTAIN

    salonId,
    map of services and artists for those services,
    date in MM-DD-YYYY format

*/
router.post('/singleArtist/list', async (req,res) => {
    try{
        const set = new Set();
        let {salonId, services} = req.body;
        let artistPromiseArr = [];
        services.forEach(service => {
            artistPromiseArr.push(Artist.find({salonId: salonId, services: {$elemMatch: {serviceId: service}}}));
        })
        let artistLists = await Promise.all(artistPromiseArr);
        artistLists = artistLists.reduce((prev, next) => prev.concat(next));
        let artistsProvidingServices = artistLists.filter(element => {
        if (set.has(element._id.toString())) return false;
        set.add(element._id.toString());
        return true;
        });
        artistsProvidingServices = artistsProvidingServices.map((ele) => {
          return {
            artistId: ele._id,
            artist: ele.name,
            serviceList: ele.services,
            rating: ele.rating
          };
        });
        res.status(200).json({artistsProvidingServices , services});
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
})

router.post('/singleArtist/request', (req,res) => {
    try{
        let {services, artist} = req.body;
        let requests = [];
        services.forEach(service => {
            let val = artist.serviceList.filter(ele => ele.serviceId === service);
            if(!val.length){
                requests.push({
                    service: service,
                    artist: "000000000000000000000000"
                })
            }else{
                requests.push({
                    service: service,
                    artist: artist.artistId
                })
            }
        })
        res.status(200).json({requests})
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
})

router.post('/schedule', jwtVerify, async (req, res) => {
    try{
        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 10;
        let skip = (page-1)*limit;
        let {salonId, requests, date} = req.body;
        if(new Date(new Date(date).toDateString()) < new Date(new Date().toDateString())){
            let err = new Error("Select a Valid Date!");
            err.code = 400;
            throw err;
        }
        let requestSet = new Set();
        requests.forEach(request => requestSet.add(request.artist));
        let uniqueArtists = Array.from(requestSet);
        let newRequests = [];
        uniqueArtists.forEach(artist => {
            requests.forEach(request => {
                if(artist === request.artist){
                    newRequests.push(request);
                }
            })
        })
        let salonSlotsLength = await getSalonSlots(salonId);
        let {request, windowSize} = await getWindowSize(newRequests, salonId, res);
        let {artistsTimeSlots, salonOpenTime} = await getTimeSlotsOfArtists(newRequests, salonSlotsLength, salonId, new Date(date));
        let perms = permutations(request);
        let randomArtistService = newRequests.filter(element => element.artist === "000000000000000000000000");
        let timeSlots = [];
        const set = new Set();

        perms.forEach((item, index) => {
            let timeSlot = bookingHelper(item, windowSize, artistsTimeSlots, salonSlotsLength, index+1);
            
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
                    set.add(timeSlot[itr].slot.toString());
                }
                item = item.concat(randomArtistService);
                timeSlots.push({key: index+1, possible: true, timeSlot, order: item})
            }else{
                timeSlots.push({key: index+1, possible: false});
            }
        })
        let timeSlotsVisible = Array.from(set);
        timeSlotsVisible = Array.from(timeSlotsVisible.map(ele => ele.split(',')));
        timeSlots = timeSlots.filter(obj => obj.possible !== false );
        let data = [];
        for(let itr = skip; itr<skip+limit; itr++){
            if(!timeSlots[itr]){
                break;
            }
            data.push(timeSlots[itr]);
        }
        res.json({salonId, timeSlots: data, artistsTimeSlots, timeSlotsVisible});

    }catch(err) {
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
})

router.post('/book', jwtVerify, async (req,res) => {
    try{
        let userId = req.user.id;
        let {timeSlots, salonId, bookingDate, key, timeSlot} = req.body;
        let data = {
            salonId: salonId,
            userId: userId,
            paymentId: "12345",
            paymentStatus: "pending",
            bookingDate: bookingDate
        }
        let artistServiceMap = [];
        let timeSlotOrder = timeSlots.filter(timeSlot => timeSlot.key === key);
        let doesTimeSlotExists = timeSlotOrder[0].timeSlot.filter(slot => slot.slot.toString() === timeSlot.toString());
        if(!doesTimeSlotExists.length){
            throw new Error("No such time slot exists for this order of services!");
        }
        timeSlotOrder = timeSlotOrder[0].order;
        let randomArr = [];
        let artistSet = new Set();
        timeSlotOrder.forEach(object => {
            if(object.artist !== "000000000000000000000000"){
                artistSet.add(object.artist.toString());
            }
        })
        timeSlotOrder.forEach(object => {
            if(object.artist === "000000000000000000000000"){
                randomArr.push(object);
            }
        })
        let {artistList, artistsFreeSlots} = await getArtistsForServices(randomArr, salonId, bookingDate);
        let testdata = await fillRandomArtists(artistList, artistsFreeSlots, salonId, timeSlot[1]);
        for(let i=0; i<timeSlotOrder.length; i++){
            for(let j=0; j<testdata.ans.length; j++){
                if(timeSlotOrder[i].service === testdata.ans[j].service._id.toString()){
                    timeSlotOrder[i].service = testdata.ans[j].service;
                    timeSlotOrder[i].artist = testdata.ans[j].artist
                }
            }
        }
        let lastTime = timeSlot[0];
        let randomServices = randomArr.map(obj => obj.service?._id?.toString());
        timeSlotOrder.forEach(object => {
            if(object.artist === "000000000000000000000000"){
                let obj = {
                    serviceId: object.service,
                    artistId: object.artist,
                    chosenBy: "algo",
                    timeSlot: {
                        start: "00:00",
                        end: "00:00"
                    }
                }
                artistServiceMap.push(obj);
                return;
            }
          
            let obj ={
                serviceId: object.service._id,
                artistId: object.artist,
            };
            if(randomServices.includes(obj.serviceId.toString())){
                obj.chosenBy = "algo";
            }else{
                obj.chosenBy = "user";
            }
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
            timeSlot: {
                start: timeSlot[0],
                end: lastTime
            },
            bookingType: Array.from(artistSet).length === 1 ? "single" : "multiple",
            artistServiceMap
        }
        let newBooking = new Booking(data);
        const booking = await newBooking.save();
        let artistArr = new Set(artistServiceMap.map(ele => ele.artistId));
        artistArr = Array.from(artistArr);
        await updateBookingData(salonId, artistArr);
        res.status(200).json(newBooking);

    }catch(err){
        console.log(err);
        res.json(wrapperMessage("failed", err.message));
    }
})

router.post("/delete", jwtVerify, async (req,res) => {
    try{
        let userId = req.user.id;
        let bookingId = req.body.bookingId;
        if(!bookingId){
            let err = new Error("Booking Id is required!");
            err.code = 400;
            throw err;
        }
        let booking = await Booking.findOne({_id: bookingId});
        let artistArr = new Set(booking.artistServiceMap.map(ele => ele.artistId));
        let salonId = booking.salonId;
        artistArr = Array.from(artistArr);
        if(!booking){
            let err = new Error("No such Booking found!");
            err.code = 404;
            throw err; 
        }
        if(booking.userId.toString() !== userId.toString()){
            let err = new Error("You are not authorized to delete this booking!");
            err.code = 403;
            throw err;
        }

        let data = await Booking.deleteOne({_id: bookingId});
        await updateBookingData(salonId, artistArr);
        res.status(200).json(wrapperMessage("success", "", data))

    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
})

router.post("/bookAgain", jwtVerify, async (req, res) => {
    try{
        let userId = req.user.id;
        let bookingId = req.body.bookingId;
        if(!bookingId){
            let err = new Error("Booking Id is required!");
            err.code = 400;
            throw err;
        }
        let booking = await Booking.findOne({_id: bookingId});
        if(!booking){
            let err = new Error("No such Booking found!");
            err.code = 404;
            throw err;
        }
        if(userId.toString() !== booking.userId.toString()){
            let err = new Error("You are not authorized to book this booking again!");
            err.code = 403;
            throw err;
        }
        let requests = [];
        booking.artistServiceMap.forEach(element => {
            requests.push({
                service: element.serviceId,
                artist: element.artistId
            });
        })
        res.status(200).json(wrapperMessage("success", "", {salonId: booking.salonId, requests}))
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
})

router.get("/user/bookings", jwtVerify, async (req,res) => {
    try{
        let userId = req.user.id;
        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 3;
        let skip = (page-1)*limit;
        let date = new Date();
        let dd = String(date.getDate()).padStart(2, '0');;
        let mm = String(date.getMonth()+1).padStart(2, '0');;
        let yyyy = date.getFullYear();
        date = new Date(`${mm}-${dd}-${yyyy}`)
        let current_bookings = await Booking.find({userId: userId, bookingDate: date});
        let previous_bookings = await Booking.find({userId: userId, bookingDate: {$lt: date}}).sort({bookingDate: -1});
        let upcoming_bookings = await Booking.find({userId: userId, bookingDate: {$gt: date}}).sort({bookingDate: 1});
        let prev_booking = [];
        for(let itr = skip; itr<skip+limit; itr++){
            if(!previous_bookings[itr]){
                break;
            }
            prev_booking.push(previous_bookings[itr]);
        }
        let coming_bookings = [];
        for(let itr = skip; itr<skip+limit; itr++){
            if(!upcoming_bookings[itr]){
                break;
            }
            coming_bookings.push(upcoming_bookings[itr]);
        }
        res.status(200).json({userId, current_bookings, prev_booking, coming_bookings});
        
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
})

module.exports = router;