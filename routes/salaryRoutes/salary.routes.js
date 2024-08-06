const router = require("express").Router();
const salaryController = require("../../controllers/salaryController/salary.controller");


router.post('/calculate-salary', salaryController.calculateSalary);
router.post('/create-salary', salaryController.createSalaryTemplate);
router.post('/updateSalaryTemplate/:salaryId', salaryController.updateSalaryTemplate);
router.post('/applySalary', salaryController.applySalary);
router.post('/update', salaryController.updateSalary);
router.get('/monthly/:partnerId', salaryController.getMonthWiseSalary);
router.get('/:partnerId', salaryController.getPartnerSalary);
router.get('/salon/:salonId', salaryController.getSalonWiseSalary);

module.exports = router;