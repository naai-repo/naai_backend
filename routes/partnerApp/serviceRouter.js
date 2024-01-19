const router = require('express').Router();
const Service = require('../../model/partnerApp/Service');
const wrapperMessage = require('../../helper/wrapperMessage');
const Salon = require('../../model/partnerApp/Salon');
const Booking = require('../../model/partnerApp/Booking');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Getting all the Services
router.get("/", async (req, res) => {
    try{
        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 3;
        let skip = (page-1)*limit;
    
        const data = await Service.find().skip(skip).limit(limit);
        res.status(200).json({data, hits: data.length});
    }catch(err){
        res.status(500).json(err);
    }
})

// Adding new Services, use the above mentioned userId, saloonId and artist Id
router.post('/add', async (req, res) => {
    const newService = new Service(req.body);
    try{
        const service = await newService.save();
        res.status(200).json(service);
    }catch(err){
        res.status(500).json(err);
    }
})

// Getting different service categories
router.get("/all", async (req,res) => {
    try{
        let serviceData = await Service.aggregate([
            {
                $group: {
                    _id: null,
                    unique_categories: {
                        $addToSet : "$category"
                    }
                }
            }
        ]);
        res.status(200).json(wrapperMessage("success", "", serviceData[0].unique_categories));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
})

// Getting individual services
router.get('/single/:id', async (req,res) => {
    try{
        let service = await Service.findOne({_id: req.params.id});
        if(!service){
            let err = new Error("Service not found!");
            err.code = 404;
            throw err; 
        }
        res.json(wrapperMessage("success", "", service));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
})

// Salon Filter based on Category
router.post("/search", async(req,res) => {
    try{
        let name = req.query.name;
        let queryObject = [];
        if(name){
            queryObject.push({serviceTitle: {$regex : name, $options: 'i'}}); 
            queryObject.push({category: {$regex : name, $options: 'i'}});
        }
        
        let serviceArr = await Service.find({$or: queryObject});
        let set = new Set();
        let salonArr = serviceArr.map(ele => ele.salonIds.map(ele => set.add(ele.toString())));
        salonArr = Array.from(set);
        salonArr = salonArr.map(ele => new ObjectId(ele));

        let location = req.body.location;
        let page = Number(req.query.page) || 1;
        let limit = Number(req.query.limit) || 3;
        let skip = (page-1)*limit;
        let salons = await Salon.aggregate([
            {
                "$geoNear": {
                    "near": location,
                    "distanceField": "distance",
                    "distanceMultiplier": 0.001
                }
            },
            {
                $match: {
                    _id: {
                        $in: salonArr
                    }
                }
            },
        ]);

        let totalBookings = await Booking.find().count("bookings");
        let totalSalons = await Salon.find().count("salons");
        let maxDistance = 0;
        let maxRating = 5;
        let maxDiscount = 50;
        let avgBookings = totalBookings / totalSalons;
        let end = 0;
        if(salons.length < 1000){
            maxDistance = salons[salons.length - 1].distance
            end = salons.length-1;
        }else{
            maxDistance = salons[1000].distance
            end = 1000;
        }

        for(let itr = 0; itr <= end; itr++ ){
            let salon = salons[itr];
            let bookings = salon.bookings >= avgBookings ? avgBookings : salon.bookings;
            let score = 0;
            score = (((maxDistance - salon.distance) / maxDistance)*0.6)
                    + ((salon.discount / maxDiscount)*0.3)
                    + ((salon.rating / maxRating)*0.07)
                    + ((bookings / avgBookings)*0.03);
            
            if(salon.paid){
                score += 0.2
            }

            salons[itr]["score"] = score;
        }
        salons.sort((a,b) => {
            if(a.score < b.score)
            return 1
            else if (a.score > b.score)
            return -1
            else return 0
        })

        let data = [];
        for(let itr = skip; itr<skip+limit; itr++){
            if(!salons[itr]){
                break;
            }
            data.push(salons[itr]);
        }

        res.status(200).json(wrapperMessage("success", "", {list: data}));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
})

// Salon Filter for searhing name
router.get("/title/search", async(req,res) => {
    try{
        let name = req.query.name;
        let queryObject = [];
        if(name){
            queryObject.push({serviceTitle: {$regex : name, $options: 'i'}}); 
            queryObject.push({category: {$regex : name, $options: 'i'}});
        }
        let serviceArr = await Service.find({$or: queryObject}).select({salonIds: 0, createdAt: 0, __v: 0, updatedAt: 0});

        res.status(200).json(wrapperMessage("success", "", {list: serviceArr, category: serviceArr[0].category}));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message))
    }
})
module.exports = router;