const router = require("express").Router();
const PlanController = require("../../controllers/planController/plan.controller");

router.get("/getPlans", PlanController.getPlans);
router.post("/create", PlanController.createPlan);
router.post("/customer/subscribe", PlanController.subscribeUserPlan);
router.post("/partner/subscribe", PlanController.subscribePartnerPlan);
router.post("/customer/cancelPlan", PlanController.cancelUserPlan);
router.post("/partner/cancelPlan", PlanController.cancelPartnerPlan);

module.exports = router;
