const wrapperMessage = require("../../helper/wrapperMessage");
const Service = require("../../model/partnerApp/Service");

exports.getServicesFromCategories = async(req, res, next) => {
    try{
        let salonId = req.query.salonId;
        const sex = req.query.sex;
        let category = req.params.category;
        let queryObject = {
            salonId
        };
        if(!salonId){
            let err = new Error("Salon ID is required!");
            err.code = 400;
            throw err;
        }

        if(category){
            queryObject.category = {$regex: category, $options: "i"};
            queryObject.targetGender = sex;
        }

        let services = await Service.find(queryObject);
        if(services.length === 0){
            let err = new Error("No services found!");
            err.code = 404;
            throw err;
        }
        res.status(200).json(wrapperMessage("success", "Services fetched successfully!", {services, count: services.length}));
    }catch(err){
        console.log(err);
        return res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
}