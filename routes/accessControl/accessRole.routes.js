const router = require("express").Router();
const AccessController = require("../../controllers/accessControl/accessRole.controller");

router.post("/create", AccessController.CreateAccessRoles);
router.get("/getAll", AccessController.GetAllAccessRoles);
router.post("/assign", AccessController.AssignAccessRolesToUsers);
router.get("/user/access", AccessController.GetAccessRoutesForUsers);

module.exports = router;