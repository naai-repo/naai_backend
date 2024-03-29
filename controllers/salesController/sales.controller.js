const ReferralUtils = require("../../helper/referralSystem/referralHelper");
const wrapperMessage = require("../../helper/wrapperMessage");
const Sales = require("../../model/sales/sales.model");

exports.createSalesAccount = async (req, res, next) => {
    try{
        const { email, password, name } = req.body;

        // Validations that the input given is correct
        if(!email || !password || !name){
            let err = new Error("Please provide all required fields!");
            err.code = 400;
            throw err;
        }else if (!/^[a-zA-Z ]*$/.test(name)) {
            let err = new Error("Invalid name entered!");
            err.code = 400;
            throw err;
        } else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            let err = new Error("Invalid email entered!");
            err.code = 400;
            throw err;
        } else if (password.length < 8) {
            let err = new Error("Password is too short!");
            err.code = 400;
            throw err;
        }

        // checking if user already exists
        let data = await Sales.findOne({ email });
        if(data){
            let err = new Error("User with this email already exists!");
            err.code = 400;
            throw err;
        }else{
            // create referral for this sales user
            const newSales = new Sales({
                email,
                password,
                name,
            });
            
            let referral = await ReferralUtils.getReferralCode(newSales._id, name, "sales");
            newSales.referral_id = referral._id;
            await newSales.save();

            res.status(200).json(wrapperMessage("success", "Sales account created successfully!", {sales: newSales, referral: referral}));
        }
    }catch(err){
        console.log(err);
        res.status(err.code || 500).json(wrapperMessage("failed", "An error occured while creating sales account!"));
    }
};