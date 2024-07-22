const CommonUtils = require("../../helper/commonUtils");
const wrapperMessage = require("../../helper/wrapperMessage");
const Attendance = require("../../model/attendance/Attendance.model");
const Partner = require("../../model/partnerApp/Partner");
const Salon = require("../../model/partnerApp/Salon");

exports.MarkAttendanceAdmin = async (req, res, next) => {
    try {
        const { salonId, userId, staffId, date, punchIn, punchOut } = req.body;

        if(!salonId || !userId || !staffId || !date || !punchIn || !punchOut) {
            console.log(salonId, staffId, date, punchIn, punchOut, userId)
            let err = new Error("Please provide all the required fields");
            err.code = 400;
            throw err;
        }
        
        let partnerData = await Partner.findOne({phoneNumber: staffId});
        if(!partnerData) {
            let err = new Error("Staff not found. Please check the phone number");
            err.code = 404;
            throw err;
        }
        
        
        // use userId to check the access level of the user
        // Add logic to make sure that the person marking attendance has proper permissions
        // i.e he is the manager / owner of the salon

        let existingAttendance = await Attendance.findOne({salonId : salonId, staffId: staffId, date: date});
        if(existingAttendance){
            res.status(200).json(wrapperMessage("success", "Attendance already marked for this date", existingAttendance));
            return;
        }
        
        const attendance = new Attendance({
            salonId,
            markedBy: userId,
            staffId,
            date,
            punchIn,
            punchOut
        });
        await attendance.save();
        res.status(200).json(wrapperMessage("success", "Attendance marked successfully", attendance));
    } catch (err) {
        console.log(err)
        res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message));
    }
}

exports.MarkAttendancePunchIn = async (req, res, next) => {
    try {
        const { salonId, staffId, date, punchIn, coords } = req.body;

        if(!salonId || !staffId || !date || !punchIn) {
            let err = new Error("Please provide all the required fields");
            err.code = 400;
            throw err;
        }

        let partnerData = await Partner.findOne({phoneNumber: staffId});
        if(!partnerData) {
            let err = new Error("Staff not found. Please check the phone number");
            err.code = 404;
            throw err;
        }

        let salonData = await Salon.findOne({_id: salonId});
        if(!salonData) {
            let err = new Error("Salon not found. Please check the salonId");
            err.code = 404;
            throw err;
        }

        // Use Haversine formula to find the distance between the salon and the staff
        let distance = CommonUtils.haversine(coords.lat, coords.long, salonData.location.coordinates[1], salonData.location.coordinates[0]);
        
        if(distance > 0.5) {
            let err = new Error(`You are ${distance*1000} meters away from the salon. Please try again when you are near the salon`);
            err.code = 400;
            throw err;
        }

        let existingAttendance = await Attendance.findOne({salonId : salonId, staffId: staffId, date: date});
        if(existingAttendance){
            res.status(200).json(wrapperMessage("success", "Attendance already marked for this date", existingAttendance));
            return;
        }

        const attendance = new Attendance({
            salonId,
            markedBy: partnerData._id,
            staffId,
            date,
            punchIn,
        });
        await attendance.save();
        res.status(200).json(wrapperMessage("success", "Attendance marked successfully", attendance));
    } catch (err) {
        console.log(err)
        res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message));
    }
}

exports.MarkAttendancePunchOut = async (req, res, next) => {
    try {
        const { salonId, staffId, date, punchOut } = req.body;

        if(!salonId || !staffId || !date || !punchOut) {
            let err = new Error("Please provide all the required fields");
            err.code = 400;
            throw err;
        }

        let partnerData = await Partner.findOne({phoneNumber: staffId});
        if(!partnerData) {
            let err = new Error("Staff not found. Please check the phone number");
            err.code = 404;
            throw err;
        }

        let existingAttendance = await Attendance.findOne({salonId : salonId, staffId: staffId, date: date});
        if(!existingAttendance) {
            let err = new Error("Attendance not marked for this date");
            err.code = 404;
            throw err;
        }
        if(existingAttendance.punchOut){
            res.status(200).json(wrapperMessage("success", "Attendance already marked for this date", existingAttendance));
            return;
        }
        existingAttendance.punchOut = punchOut;
        await existingAttendance.save();
        res.status(200).json(wrapperMessage("success", "Attendance marked successfully", existingAttendance));
    } catch (err) {
        console.log(err)
        res.status(err.code || 500).json(wrapperMessage(err.status || "failed", err.message));
    }
}