const Memberships = require("../../model/membership/Membership.model");
const CommonUtils = require("../../helper/commonUtils");
const wrapperMessage = require("../../helper/wrapperMessage");
const User = require("../../model/customerApp/User");
const { mongoose } = require("mongoose");
const MembershipDiscount = require("../../helper/MembershipDiscounts");

exports.CreateMembership = async (req, res, next) => {
  try {
    const membershipBody = req.body;
    const salon = await CommonUtils.checkIfSalonExists(membershipBody.salonId);
    if (!salon) {
      let err = new Error("Salon Not Found");
      err.code = 404;
      throw err;
    }
    const membership = new Memberships(membershipBody);
    await membership.save();
    res
      .status(200)
      .json(
        wrapperMessage("success", "Membership Created Successfully", membership)
      );
  } catch (err) {
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
};

exports.GetMembershipsForSalons = async (req, res, next) => {
  try {
    const salonId = req.params.salonId;
    const salon = await CommonUtils.checkIfSalonExists(salonId);
    if (!salon) {
      let err = new Error("Salon Not Found");
      err.code = 404;
      throw err;
    }
    const memberships = await Memberships.find({ salonId: salonId });
    res.status(200).json(
      wrapperMessage("success", "Memberships Fetched Successfully", {
        count: memberships.length,
        salonId: salonId,
        memberships,
      })
    );
  } catch (err) {
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
};

// Edit a membership

exports.EditMembership = async (req, res, next) => {
  try {
    const membershipBody = req.body;
    const membershipId = req.params.membershipId;
    const membership = await Memberships.findOne({ _id: membershipId });
    if (!membership) {
      let err = new Error("Membership Not Found");
      err.code = 404;
      throw err;
    }
    const updatedMembership = await Memberships.updateOne(
      { _id: membershipId },
      membershipBody
    );
    res
      .status(200)
      .json(
        wrapperMessage(
          "success",
          "Membership Updated Successfully",
          updatedMembership
        )
      );
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
};

// Delete a membership

exports.DeleteMembership = async (req, res, next) => {
  try {
    const membershipId = req.params.membershipId;
    const membership = await Memberships.findOne({ _id: membershipId });
    if (!membership) {
      let err = new Error("Membership Not Found");
      err.code = 404;
      throw err;
    }
    let deletedMembership = await Memberships.deleteOne({ _id: membershipId });
    res
      .status(200)
      .json(
        wrapperMessage(
          "success",
          "Membership Deleted Successfully",
          deletedMembership
        )
      );
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
};

// Add Memebership to Users

exports.AddMembershipToUser = async (req, res, next) => {
  try {
    const membershipId = req.body.membershipId;
    const userId = req.body.userId;

    const membership = await Memberships.findOne({ _id: membershipId });
    if (!membership) {
      let err = new Error("Membership Not Found");
      err.code = 404;
      throw err;
    }
    const user = await User.findOne({ _id: userId });
    if (!user) {
      let err = new Error("User Not Found");
      err.code = 404;
      throw err;
    }
    user.membership.id = membershipId;
    user.membership.wallet_amount = (user.membership.wallet_amount ?? 0) + membership.wallet_amount_credit;
    user.membership.all_services_discount_max_count =
      membership.all_services_discount_max_count;
    user.membership.all_products_discount_max_count =
      membership.all_products_discount_max_count;
    user.membership.products = membership.products;
    user.membership.services = membership.services;
    await user.save();
    res
      .status(200)
      .json(
        wrapperMessage("success", "Membership Added to User Successfully", user)
      );
  } catch (err) {
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
};

exports.ApplyMembershipDiscount = async (req, res, next) => {
  try{
    const userId = req.body.userId;
    const selectedServices = req.body.selectedServices;
    const aggreagtion_to_get_users_membership = [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $lookup: {
          from: "memberships",
          localField: "membership.id",
          foreignField: "_id",
          as: "membershipDetails"
        }
      },
      {
        $addFields: {
          membershipDetails: {
            $arrayElemAt: ["$membershipDetails", 0]
          }
        }
      },
      {
        $addFields: {
          membership: {
            $mergeObjects: [
              "$membershipDetails",
              "$membership"
            ]
          }
        }
      },
      {
        $project: {
          id: "$_id",
          _id: 0,
          name: 1,
          phoneNumber: 1,
          gender: 1,
          birthDate: 1,
          aniversary: 1,
          email: 1,
          membership: 1
        }
      }
    ];
    let user = await User.aggregate(aggreagtion_to_get_users_membership);
    user = user[0];
    if (!user) {
      let err = new Error("User Not Found");
      err.code = 404;
      throw err;
    }
    let data = {services : selectedServices};
    let totalBill = 0;
    selectedServices.forEach(service => {
      totalBill += service.price + service.tax;
    });
    if(totalBill >= user.membership?.min_bill_amount){
      if(user.membership?.discount_type === 0 || user.membership?.discount_type === 1){
        data = MembershipDiscount.discountTotalBill(selectedServices, user.membership, totalBill);
      }else if(user.membership?.all_services_discount_type === 0 || user.membership?.all_services_discount_type === 1){
        data = MembershipDiscount.allServicesDiscount(selectedServices, user.membership);
        user.membership.all_services_discount_max_count = data.customerCount;
      }else if(user.membership?.services.length){
        data = MembershipDiscount.servicesDiscount(selectedServices, user.membership);
      }
    }
    res.status(200).json(
      wrapperMessage("success", "Discount Applied Successfully", {
        user, data
      })
    );
  }catch(err){
    console.log(err);
    res.status(err.code || 500).json(wrapperMessage("failed", err.message));
  }
}