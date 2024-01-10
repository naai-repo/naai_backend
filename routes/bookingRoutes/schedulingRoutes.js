const router = require('express').Router();
const mongoose = require('mongoose');
const wrapperMessage = require('../../helper/wrapperMessage');
const { getSalonSlots, getWindowSize, getTimeSlotsOfArtists, permutations, bookingHelper, getSalonTimings } = require('../../helper/bookingHelper');
const Booking = require('../../model/partnerApp/Booking');
const Artist = require('../../model/partnerApp/Artist');

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
        artistsProvidingServices = artistsProvidingServices.map(ele => { return {artistId: ele._id, artist: ele.name, serviceList: ele.services}})
        res.json({artistsProvidingServices , services});
    }catch(err){
        console.log(err);
        res.json(wrapperMessage("failed", err.message))
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
        res.json({requests})
    }catch(err){
        console.log(err);
        res.json(wrapperMessage("failed", err.message));
    }
})

router.post('/schedule', async (req, res) => {
    try{
        let {salonId, requests, date} = req.body;
        let salonSlotsLength = await getSalonSlots(salonId, res);
        let {request, windowSize} = await getWindowSize(requests, salonId, res);
        let {artistsTimeSlots, salonOpenTime} = await getTimeSlotsOfArtists(requests, salonSlotsLength, salonId, new Date(date));
        let perms = permutations(request);
        let randomArtistService = requests.filter(element => element.artist === "000000000000000000000000");
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
                item = item.concat(randomArtistService);
                timeSlots.push({key: index+1, possible: true, timeSlot, order: item})
            }else{
                timeSlots.push({key: index+1, possible: false});
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
        let {timeSlots, salonId, bookingDate, key, timeSlot} = req.body;
        let data = {
            salonId: salonId,
            userId: "12345",
            paymentId: "12345",
            paymentStatus: "pending",
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
            if(object.artist === "000000000000000000000000"){
                let obj = {
                    serviceId: object.service,
                    artistId: object.artist,
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