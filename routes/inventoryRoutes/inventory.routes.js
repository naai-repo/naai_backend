const router = require("express").Router();
const InventoryController = require("../../controllers/inventoryController/inventory.controller");

router.post("/addCompany", InventoryController.addCompany);
router.post("/addProduct", InventoryController.addProduct);
router.post("/updateProduct/:productId", InventoryController.updateProduct);
router.get("/products", InventoryController.getProducts);
router.get("/companies", InventoryController.getCompanies);
router.get("/companyBySalonId", InventoryController.getCompaniesBySalonId);

// router.post("/partner/subscribe", PlanController.subscribePartnerPlan);
// router.post("/customer/cancelPlan", PlanController.cancelUserPlan);
// router.post("/partner/cancelPlan", PlanController.cancelPartnerPlan);

module.exports = router;
