const { ObjectId } = require("mongodb");

class MembershipDiscount {
  static applyMembershipDiscountToService = (service, discount) => {
    console.log("discount", discount);
    let amount = service.price + service.tax;
    let newAmount = amount - discount;
    let newBasePrice = (newAmount / 1.18).toFixed(2);
    let newPrice = (newAmount / 1.18).toFixed(2);
    let newTax = (newAmount - newPrice).toFixed(2);
    return {
      ...service,
      price: Number(newPrice),
      basePrice: Number(newBasePrice),
      tax: Number(newTax),
      disc: Number(discount),
    };
  };

  static discountTotalBill = (selectedServices, membership, totalBill) => {
    let newSelectedServices = [];
    let discount =
      membership.discount_type === 0
        ? totalBill * (membership.discount_type_value / 100)
        : membership.discount_type_value;
    if(discount > membership.max_discount_amount){
      discount = membership.max_discount_amount;
    }
    let newTotalBill = totalBill - discount;
    for (let service of selectedServices) {
      let proportion_of_service = (service.price + service.tax) / totalBill;
      let amount_for_service = newTotalBill * proportion_of_service;
      let initialAmount = service.price + service.tax;
      service.price = Number((amount_for_service / 1.18).toFixed(2));
      service.basePrice = Number((amount_for_service / 1.18).toFixed(2));
      service.tax = Number((amount_for_service - service.price).toFixed(2));
      service.disc = Number((initialAmount - amount_for_service).toFixed(2));
      newSelectedServices.push(service);
    }
    return { services: newSelectedServices };
  };

  static allServicesDiscount = (selectedServices, membership) => {
    let newSelectedServices = [];
    membership.all_services_include = membership.all_services_include.map(
      (id) => id.toString()
    );
    membership.all_services_except = membership.all_services_except.map((id) =>
      id.toString()
    );
    let customerCount = membership.all_services_discount_max_count;

    for (let service of selectedServices) {
      if (customerCount === 0) {
        newSelectedServices.push(service);
        continue;
      }
      if (service.price + service.tax < membership.minimum_service_cost) {
        newSelectedServices.push(service);
        continue;
      }
      if (service.qty > customerCount) {
        let totalServiceQty = service.qty;
        let newService = {
          ...service,
          qty: totalServiceQty - customerCount,
        };
        newSelectedServices.push(newService);
        service.qty = totalServiceQty - newService.qty;
      }
      let discount =
        membership.all_services_discount_type === 0
          ? (service.price + service.tax) *
            (membership.all_services_discount_type_value / 100)
          : membership.all_services_discount_type_value;
      if (membership.all_services_include.length) {
        if (membership.all_services_include.includes(service.serviceId)) {
          newSelectedServices.push(
            MembershipDiscount.applyMembershipDiscountToService(
              service,
              discount
            )
          );
          customerCount -= service.qty;
          continue;
        }
      }
      if (membership.all_services_except.length) {
        if (membership.all_services_except.includes(service.serviceId)) {
          newSelectedServices.push(service);
        }
        customerCount -= service.qty;
        continue;
      }
      newSelectedServices.push(service);
    }

    return { customerCount, services: newSelectedServices };
  };

  static servicesDiscount = (selectedServices, membership) => {};
}

module.exports = MembershipDiscount;
