const wrapperMessage = require('../../helper/wrapperMessage');
const Features = require('../../model/featuresAndPages/Feature.model');

exports.CreateFeature = async (req, res, next) => {
    try{
        let {name, feature_name, feature_type, permissions} = req.body;
        if(!name || !feature_name || !feature_type || !permissions){
            let err = new Error("All fields are required");
            err.code = 400;
            throw err;
        }
        if(permissions.length === 0){
            let err = new Error("At least one permission is required");
            err.code = 400;
            throw err;
        }
        let existingFeature = await Features.findOne({feature_name});
        if(existingFeature){
            let err = new Error("Feature with this feature_name already exists");
            err.code = 400;
            throw err;
        }
        let newFeature = new Features({name, feature_name, feature_type, permissions});
        await newFeature.save();
        res.status(200).json(wrapperMessage("success", "Feature created successfully", newFeature));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message))
    }
}

exports.GetFeatures = async (req, res, next) => {
    try{
        let type = req.query.type;
        if(!type){
            let err = new Error("Type is required");
            err.code = 400;
            throw err;
        }
        let features = await Features.find({feature_type: type});
        res.status(200).json(wrapperMessage("success", "Features fetched successfully", features));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message))
    }
}