const User = require("../../model/customerApp/User");
const Memberships = require("../../model/membership/Membership.model");
const Product = require("../../model/partnerApp/inventory/product.model");

class WalkinUtils {
  static addMemberships = (customer, service) => {
    return new Promise(async (resolve, reject) => {
      try {
        let membership = await Memberships.findOne({ _id: service.serviceId });
        if (!membership) {
          let err = new Error("Membership not found");
          err.code = 404;
          throw err;
        }
        let user = await User.findOne({ _id: customer.id });
        user.membership.id = membership._id;
        user.membership.wallet_amount =
          ((user.membership.wallet_amount ?? 0) +
          membership.wallet_amount_credit) * service.qty;
        user.membership.all_services_discount_max_count =
          (membership.all_services_discount_max_count) * service.qty;
        user.membership.all_products_discount_max_count =
          (membership.all_products_discount_max_count) * service.qty;
        user.membership.products = membership.products;
        user.membership.services = membership.services;
        await user.save();
        let obj = {
          id: service.serviceId,
          name: service.serviceName,
          cost: service.basePrice,
          discountCost: service.price,
          tax: service.tax,
          qty: service.qty,
          staffId: service.artistId,
          staffName: service.name,
        };
        resolve(obj);
      } catch (err) {
        reject(err);
      }
    });
  };

  static addProducts = (customer, service) => {
    return new Promise(async (resolve, reject) => {
      try {
        let product = await Product.findOne({ _id: service.serviceId });
        if (!product) {
          let err = new Error("Product not found");
          err.code = 404;
          throw err;
        }
        let obj = {
          id: service.serviceId,
          name: service.serviceName,
          cost: service.basePrice,
          discountCost: service.price,
          tax: service.tax,
          qty: service.qty,
          staffId: service.artistId,
          staffName: service.name,
        };
        resolve(obj);
      } catch (err) {
        reject(err);
      }
    });
  };
}

module.exports = WalkinUtils;
