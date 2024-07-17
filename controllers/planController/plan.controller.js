const Plan = require("../../model/plan/plan.model");
const wrapperMessage = require("../../helper/wrapperMessage");
const User = require("../../model/customerApp/User");
const Salon = require("../../model/partnerApp/Salon");


exports.createPlan = async (req, res, next) => {
  try {
    const { title, subtitle, durationInMonths, price, commission, type } =
      req.body;
    let existingPlan = await Plan.findOne({ title, subtitle, type });
    if (existingPlan) {
      let err = new Error("Plan with this title or subtitle already exists!");
      err.code = 400;
      throw err;
    }
    const plan = new Plan({
      title,
      subtitle,
      durationInMonths,
      price,
      commission,
      type,
    });
    await plan.save();
    res
      .status(200)
      .json(wrapperMessage("success", "Plan created successfully!", plan));
  } catch (err) {
    console.log(err);
    return res
      .status(err.code || 500)
      .json(wrapperMessage("failed", err.message));
  }
};

exports.getPlans = async (req, res, next) => {
  try {
    let type = req.query.type;
    let duration = req.query.duration;
    let title = req.query.title;
    let matchOptions = {};
    if (title) {
      matchOptions.title = { $regex: title, $options: "i" };
    }
    if (duration) {
      matchOptions.subtitle = { $regex: duration, $options: "i" };
    }
    if (type) {
      matchOptions.type = { $regex: type, $options: "i" };
    }

    let plans = await Plan.find(matchOptions);

    if (plans.length === 0) {
      let err = new Error("No plans found!");
      err.code = 404;
      throw err;
    }
    res
      .status(200)
      .json(
        wrapperMessage("success", "Plans fetched successfully!", {
          plans: plans,
          count: plans.length,
        })
      );
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
};

exports.subscribeUserPlan = async (req, res, next) => {
  try {
    const { userId, planId } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      let err = new Error("User not found!");
      err.code = 404;
      throw err;
    }

    const plan = await Plan.findById(planId);

    if (!plan) {
      let err = new Error("Plan not found!");
      err.code = 404;
      throw err;
    }
    if (plan.type !== "customer") {
      let err = new Error("This plan is not for customers!");
      err.code = 400;
      throw err;
    }

    user.subscription.plan = planId;
    user.subscription.expiryDate = new Date(
      Date.now() + plan.durationInMonths * 30 * 24 * 60 * 60 * 1000
    );

    await user.save();

    res
      .status(200)
      .json(wrapperMessage("success", "Plan added to user successfully", user));
  } catch (error) {
    console.error("Error in addPlanToUser:", error);
    res.status(error.code || 500).json(wrapperMessage("failed", error.message));
  }
};

exports.subscribePartnerPlan = async (req, res, next) => {
    try{
        const { salonId, planId } = req.body;
        
        let salon = await Salon.findById(salonId);
        if(!salon){
            let err = new Error("Salon not found!");
            err.code = 404;
            throw err;
        }
        let plan = await Plan.findById(planId);
        if(!plan){
            let err = new Error("Plan not found!");
            err.code = 404;
            throw err;
        }
        if(plan.type !== "partner"){
            let err = new Error("This plan is not for partners!");
            err.code = 400;
            throw err;
        }
        
        salon.subscription.planId = planId;
        salon.subscription.planName = plan.title;
        salon.subscription.startDate = new Date(Date.now());
        salon.subscription.endDate = new Date(Date.now() + plan.durationInMonths * 30 * 24 * 60 * 60 * 1000);
        salon.subscription.renewed = false;
        salon.subscription.features = plan.features;
        await salon.save();

        res.status(200).json(wrapperMessage("success", "Plan added to salon successfully", salon));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
}

exports.cancelUserPlan = async (req, res, next) => {
    try{
        const { userId } = req.body;
        let user = await User.findById(userId);
        if(!user){
            let err = new Error("User not found!");
            err.code = 404;
            throw err;
        }
        user.subscription.plan = process.env.NULL_OBJECT_ID;
        user.subscription.expiryDate = new Date(Date.now());
        user.subscription.startDate = new Date(Date.now());
        await user.save();
        res.status(200).json(wrapperMessage("success", "Plan cancelled successfully", user));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
}

exports.cancelPartnerPlan = async (req, res, next) => {
    try{
        const { salonId } = req.body;
        let salon = await Salon.findById(salonId);
        if(!salon){
            let err = new Error("Salon not found!");
            err.code = 404;
            throw err;
        }
        salon.subscription.planId = process.env.NULL_OBJECT_ID;
        salon.subscription.planName = "";
        salon.subscription.startDate = new Date(Date.now());
        salon.subscription.endDate = new Date(Date.now());
        salon.subscription.renewed = false;
        salon.subscription.features = [];
        await salon.save();
        res.status(200).json(wrapperMessage("success", "Plan cancelled successfully", salon));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", err.message));
    }
}