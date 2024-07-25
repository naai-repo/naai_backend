const router = require("express").Router();
const salaryController = require("../../controllers/salaryController/salary.controller");


router.post('/calculate-salary', salaryController.calculateSalary);

router.post('/create-salary', salaryController.createSalaryTemplate);
router.post('/applySalary', salaryController.applySalary);
module.exports = router;