


const User = require('../../model/customerApp/User');
const Salary = require('../../model/salary/salary.model');
const Partner = require('../../model/partnerApp/Partner')


exports.createSalaryTemplate = async (req, res) => {
    try {
      const { earnings, deductions, paymentMethod, salonId, startDate } = req.body;
  
      const salaryTemplate = new Salary({
        partnerId: null,
        startDate, 
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
      const { templateId, partnerId, salonId, startDate} = req.body;
  
      // Check if the template exists
      const template = await Salary.findById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
  
      // Check if the partner exists
      const partner = await Partner.findById(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      // Check if a salary is already attached to the partner
      const existingSalary = await Salary.findOne({ partnerId });
      if (existingSalary) {
        return res.status(400).json({
          message: "Salary already attached to this Partner",
        });
}

  
      // Create a new salary using the template
      const salary = new Salary({
        startDate,
        partnerId,
        salonId,
        earnings: template.earnings,
        deductions: template.deductions,
        paymentMethod: template.paymentMethod,
      });
  
      // Save the new salary
      await salary.save();
  
      // Update the partner to include the new salary
      await Partner.findByIdAndUpdate(partnerId, {
        salary: salary._id,
      });
      
  
      res.status(200).json({
        message: "Salary template applied to the partner",
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



// API to Save or Update Salary for a Specific Month
exports.updateSalary =  async (req, res) => {
  const { partnerId, salonId, earnings, deductions, paymentMethod, effectiveYear, effectiveMonth } = req.body;

  try {
    // Find existing salary record for the specific month and year
    let salary = await Salary.findOne({
      partnerId,
      effectiveYear,
      effectiveMonth
    });

    if (salary) {
      // Update the existing salary record
      salary.earnings = earnings;
      salary.deductions = deductions;
      salary.paymentMethod = paymentMethod;
      await salary.save();
    } else {
      // Create a new salary record for the specific month
      salary = new Salary({
        partnerId,
        salonId,
        earnings,
        deductions,
        paymentMethod,
        effectiveYear,
        effectiveMonth,
      });
      await salary.save();
    }

    res.status(200).json({ message: "Salary updated successfully", salary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// API to Fetch Monthly Salary for a Partner
exports.getMonthWiseSalary = async (req, res) => {
  const { partnerId } = req.params;
  const { year, month } = req.query;
  

  try {
    const salary = await Salary.findOne({
      partnerId,
      effectiveYear: year,
      effectiveMonth: month,
    });

    if (!salary) {
        
      return res.status(200).json({message:'salary not found' });
    }

    res.status(200).json(salary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getPartnerSalary = async (req, res) => {
  const { partnerId } = req.params;

try{

  const salary = await Salary.findOne({ partnerId });
  res.status(200).json(salary);
}
  catch (error) {
    res.status(500).json({ error: error.message });
  }
};





          

  
  
//
exports.updateSalaryTemplate = async (req, res) => {
  try {
    const { salaryId } = req.params; // Get salaryId from URL parameters
    const { earnings, deductions, paymentMethod, salonId, startDate } = req.body;

    // Find the salary template by ID
    const salaryTemplate = await Salary.findById(salaryId);

    if (!salaryTemplate) {
      return res.status(404).json({ message: "Salary template not found." });
    }

    // Update the fields with new data
    salaryTemplate.earnings = earnings || salaryTemplate.earnings;
    salaryTemplate.deductions = deductions || salaryTemplate.deductions;
    salaryTemplate.paymentMethod = paymentMethod || salaryTemplate.paymentMethod;
    salaryTemplate.salonId = salonId || salaryTemplate.salonId;
    salaryTemplate.startDate = startDate || salaryTemplate.startDate;

    // Save the updated salary template
    await salaryTemplate.save();

    res.status(200).json({
      message: "Salary template updated successfully.",
      salaryTemplate,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};