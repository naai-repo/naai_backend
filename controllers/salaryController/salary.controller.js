

const User = require('../../model/customerApp/User');

const Salary = require('../../model/salary/salary.model');
const Artist = require('../../model/partnerApp/Artist');


  exports.createSalaryTemplate = async (req, res) => {
    try {
      const { earnings, deductions, paymentMethod, salonId } = req.body;
  
      const salaryTemplate = new Salary({
        partnerId: null,
        salonId, salonId,
        earnings,
        deductions,
        paymentMethod,
      });
  
      await salaryTemplate.save();
  
      res.status(201).json({
        message: "Salary template created successfully.",
        salaryTemplate,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  

  exports.applySalary = async (req, res) => {
    try {
      const { templateId, partnerId, salonId , staffId, artistId } = req.body;
  
      // Check if the template exists
      const template = await Salary.findById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
  
      // Check if the partner exists
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(404).json({ message: "Artist not found" });
      }
  
      // Check if a salary is already attached to the partner
      const existingSalary = await Salary.findOne({ artistId });
      if (existingSalary) {
        return res.status(400).json({
          message: "Salary already attached to this Artist",
        });
}

  
      // Create a new salary using the template
      const salary = new Salary({
        artistId,
        salonId,
        earnings: template.earnings,
        deductions: template.deductions,
        paymentMethod: template.paymentMethod,
      });
  
      // Save the new salary
      await salary.save();
  
      // Update the partner to include the new salary
      await Artist.findByIdAndUpdate(artistId, {
        salary: salary._id,
      });
      
  
      res.status(200).json({
        message: "Salary template applied to the artist",
        salary,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};




exports.calculateSalary = async (req, res) => {
         let daysInAMonth = [31,30,31,30,31,30, 31,31,30,31,30,31];
            const { partnerId, year, month } = req.body;
          
            try {
              // Fetch the Salary Template for the Partner
              const salaryTemplate = await Salary.findOne({ partnerId });
              if (!salaryTemplate) {
                return res.status(404).json({ message: "Salary template not found for the partner" });
              }
          
              // Fetch Leaves for the Partner for the given month
              const startDate = new Date(year, month - 1, 1);
              const endDate = new Date(year, month, 0);
              const leaves = await Leave.find({
                staffId: partnerId,
                date: { $gte: startDate, $lte: endDate },
              });
          
              // Calculate Deductions for Leaves
              let leaveDeductions = 0;
              leaves.forEach((leave) => {
                switch (leave.leave_category) {
                  case "quarter day absent":
                    leaveDeductions += 0.25 * (leave.leave_type === "paid" ? 0 : 1);
                    break;
                  case "half day absent":
                    leaveDeductions += 0.5 * (leave.leave_type === "paid" ? 0 : 1);
                    break;
                  case "full day absent":
                    leaveDeductions += 1 * (leave.leave_type === "paid" ? 0 : 1);
                    break;
                  default:
                    break;
                }
              });
          
              // Calculate Total Earnings and Deductions
              const totalEarnings = salaryTemplate.earnings.reduce((acc, earning) => acc + earning.value, 0);
              const fixedDeductions = salaryTemplate.deductions.reduce((acc, deduction) => acc + deduction.value, 0);
              const totalDeductions = fixedDeductions + (leaveDeductions * (totalEarnings/daysInAMonth[Number(month-1)]) );
          
              // Calculate Net Salary
              const netSalary = totalEarnings - (totalDeductions)
              res.status(200).json({
                totalEarnings,
                fixedDeductions,
                leaveDeductions,
                totalDeductions,
                netSalary,
              });
            } catch (error) {
              res.status(500).json({ error: error.message });
            }
          };
          

  
  

//   curl -X POST http://localhost:3000/salary-template \
//   -H "Content-Type: application/json" \
//   -d '{
//         "earnings": [
//           { "type": "Basic", "value": 5000 },
//           { "type": "House Rent Allowance", "value": 2000 },
//           { "type": "Bonus", "value": 500 }
//         ],
//         "deductions": [
//           { "type": "Advance", "value": 1000 },
//           { "type": "Provident Fund", "value": 300 },
//           { "type": "Income Tax", "value": 200 }
//         ],
//         "paymentMethod": "bank transfer"
//       }'

