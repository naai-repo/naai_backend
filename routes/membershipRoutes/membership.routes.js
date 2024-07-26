const router = require("express").Router();
const MembershipController = require("../../controllers/membership/membership.controller");

router.post("/create", MembershipController.CreateMembership);
router.get("/get/:salonId", MembershipController.GetMembershipsForSalons);
router.post("/edit/:membershipId", MembershipController.EditMembership);
router.get("/delete/:membershipId", MembershipController.DeleteMembership);

module.exports = router;