const wrapperMessage = require("../../helper/wrapperMessage");
const Coupons = require("../../model/coupons/coupon.model");
const Salon = require("../../model/partnerApp/Salon");

exports.createCoupons = async (req, res, next) => {
    try {
        let { code, discount, expiryDate, salonId, min_cart_value, max_value, isActive, rules } = req.body;
        let salon = await Salon.findOne({_id: salonId});
        if(!salon){
            let err = new Error("No Such Salon found!");
            err.code = 404;
            throw err;
        }

        let existingCoupon = await Coupons.findOne({code});
        console.log("HERE: ", existingCoupon);
        if(existingCoupon) {
            let err = new Error("Coupon with this code already exists!");
            err.code = 400;
            throw err;
        }
        expiryDate = expiryDate.split("/").map(ele => Number(ele));
        expiryDate = new Date(expiryDate[2], expiryDate[0] - 1, expiryDate[1], 24, 0);
        const coupon = new Coupons({
            code,
            discount,
            expiryDate,
            salonId,
            min_cart_value,
            max_value,
            isActive,
            rules
        });
        await coupon.save();
        res.status(200).json(wrapperMessage("success", "Coupon created successfully!", coupon));
    } catch (err) {
        console.log(err);
        return res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
};

exports.getCoupons = async (req, res, next) => {
    try {
        let code = req.query.code;
        let salonId = req.query.salonId;

        let matchOptions = {};
        if(code) {
            matchOptions.code = { $regex: code, $options: "i" };
        }
        if(salonId){
            matchOptions.salonId = salonId;
        }else{
            matchOptions.salonId = process.env.NULL_OBJECT_ID;
        }

        let coupons = await Coupons.find(matchOptions);

        if(coupons.length === 0) {
            let err = new Error("No coupons found!");
            err.code = 404;
            throw err;
        }
        
        res.status(200).json(wrapperMessage("success", "Coupons fetched successfully!", {coupons: coupons, count: coupons.length}));
    } catch (err) {
        console.log(err);
        return res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
};

