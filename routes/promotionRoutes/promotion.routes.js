const router = require("express").Router();
const PromotionController = require("../../controllers/promotionController/promotion.controller");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/whatsapp", upload.array("images", 10), PromotionController.SendWhatsappPromos);
router.post("/sendSmstoCustomers", PromotionController.sendCustomersToQueueForSms);
module.exports = router;