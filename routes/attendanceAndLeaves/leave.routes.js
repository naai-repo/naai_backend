const router = require("express").Router();
const LeaveController = require("../../controllers/attendanceAndLeaves/leave.controller");

router.post("/markLeave", LeaveController.MarkLeave);
router.get("/getLeaves", LeaveController.GetLeaves);
router.get("/range", LeaveController.getRangeLeaves);
router.get("/delete/:id", LeaveController.deleteLeave);
router.post("/update/:id", LeaveController.updateLeave);

module.exports = router;