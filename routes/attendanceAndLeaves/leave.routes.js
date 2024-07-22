const router = require("express").Router();
const LeaveController = require("../../controllers/attendanceAndLeaves/leave.controller");

router.post("/markLeave", LeaveController.MarkLeave);
router.get("/getLeaves", LeaveController.GetLeaves);

module.exports = router;