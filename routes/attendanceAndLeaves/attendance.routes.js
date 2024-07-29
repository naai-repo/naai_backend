const router = require("express").Router();
const AttendanceController = require("../../controllers/attendanceAndLeaves/attendance.controller");

router.post("/admin/mark", AttendanceController.MarkAttendanceAdmin);
router.post("/punchin", AttendanceController.MarkAttendancePunchIn);
router.post("/punchout", AttendanceController.MarkAttendancePunchOut);
router.get("/range", AttendanceController.getRangeAttendance);
router.get("/delete/:id", AttendanceController.deleteAttendance);
router.post("/update/:id", AttendanceController.updateAttendance);

module.exports = router;