const wrapperMessage = require('../../helper/wrapperMessage');
const Leave = require('../../model/leaves/Leave.model');
const Partner = require('../../model/partnerApp/Partner');

exports.MarkLeave = async (req, res, next) => {
    try{
        const { salonId, staffId, date, leave_type, leave_category } = req.body;
        if(!salonId || !staffId || !date || !leave_type || !leave_category){
            let err = new Error("Please provide all the required fields");
            err.code = 400;
            throw err;
        }
        let partner = await Partner.findOne({salonId: salonId, phoneNumber: staffId});
        if(!partner){
            let err = new Error("Staff not found");
            err.code = 404;
            throw err;
        }
        let existingLeave = await Leave.findOne({salonId : salonId, staffId: staffId, date: date});
        if(existingLeave){
            res.status(200).json(wrapperMessage("success", "Leave already marked for this date", existingLeave));
            return;
        }
        const leave = new Leave({
            salonId,
            staffId,
            date,
            leave_type,
            leave_category,
        });
        await leave.save();
        res.status(200).json(wrapperMessage("success", "Leave marked successfully", leave));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message));
    }
}

exports.GetLeaves = async (req, res, next) => {
    try{
        const salonId = req.query.salonId;
        const staffId = req.query.staffId;
        if(!salonId || !staffId){
            let err = new Error("Please provide all the required fields");
            err.code = 400;
            throw err;
        }
        let leaves = await Leave.find({salonId: salonId, staffId: staffId});
        res.status(200).json(wrapperMessage("success", "Leaves fetched successfully", leaves));
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message));
    }
}

exports.getRangeLeaves = async (req, res, next) => {
    try {
        const { salonId, staffId, start, end } = req.query;

        if(!salonId || !staffId || !start || !end) {
            let err = new Error("Please provide all the required fields");
            err.code = 400;
            throw err;
        }

        let leaves = await Leave.find({salonId: salonId, staffId: staffId, date: {$gte: start, $lte: end}});
        res.status(200).json(wrapperMessage("success", "Leaves fetched successfully", leaves));
    } catch (err) {
        console.log(err)
        res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message));
    }
}

exports.deleteLeave = async (req, res, next) => {
    try {
        const { id } = req.params;

        if(!id) {
            let err = new Error("Please provide all the required fields");
            err.code = 400;
            throw err;
        }

        let leave = await Leave.deleteOne({_id: id});
        res.status(200).json(wrapperMessage("success", "Leave deleted successfully", leave));
    } catch (err) {
        console.log(err)
        res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message));
    }
};

exports.updateLeave = async (req, res, next) => {
    try {
        const { id } = req.params;

        if(!id) {
            let err = new Error("Please provide all the required fields");
            err.code = 400;
            throw err;
        }

        let updatedLeave = await Leave.findOneAndUpdate({_id: id}, req.body, {new: true});
        if(!updatedLeave) {
            let err = new Error("Leave not found");
            err.code = 404;
            throw err;
        }
        res.status(200).json(wrapperMessage("success", "Leave updated successfully", updatedLeave));
    } catch (err) {
        console.log(err)
        res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message));
    }
}