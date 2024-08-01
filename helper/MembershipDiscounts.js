const { ObjectId } = require("mongodb");

class MembershipDiscount {
  static applyMembershipDiscountToService = (service, discount) => {
    console.log("discount", discount);
    let amount = service.price + service.tax;
    let newAmount = amount - discount;
    let newBasePrice = (newAmount/1.18).toFixed(2);
    let newPrice = (newAmount/1.18).toFixed(2);
    let newTax = (newAmount - newPrice).toFixed(2);
    return{
      ...service,
      price: newPrice,
      basePrice: newBasePrice,
      tax: newTax,
      disc: discount
    }
  };

  static discountTotalBill = (selectedServices, membership, totalBill) => {
    let newSelectedServices = [];
    for (let service of selectedServices) {
      let discount = membership.discount_type === 0
      ? (service.price + service.tax) * (membership.discount_type_value / 100)
      : membership.discount_type_value;
      newSelectedServices.push(
        MembershipDiscount.applyMembershipDiscountToService(service, discount)
      );
    }
    return {newSelectedServices};
  };

  static allServicesDiscount = (selectedServices, membership) => {
    let newSelectedServices = [];
    membership.all_services_include = membership.all_services_include.map(id => id.toString());
    membership.all_services_except = membership.all_services_except.map(id => id.toString());
    let customerCount = membership.all_services_discount_max_count;
    for (let service of selectedServices) {
      if(customerCount === 0){
        newSelectedServices.push(service);
        continue;
      }
      if((service.price + service.tax) <= membership.minimum_service_cost){
        newSelectedServices.push(service);
        continue;
      }
      let discount = membership.all_services_discount_type === 0
      ? (service.price + service.tax) * (membership.all_services_discount_type_value / 100)
      : membership.all_services_discount_type_value;
      if(membership.all_services_include.length){
        if (membership.all_services_include.includes(service.serviceId)) {
          newSelectedServices.push(
            MembershipDiscount.applyMembershipDiscountToService(service, discount)
          );
          customerCount--;
          continue;
        }
      }
      if(membership.all_services_except.length){
        if (membership.all_services_except.includes(service.serviceId)) {
          newSelectedServices.push(service);
        }
        customerCount--;
        continue;
      }
      newSelectedServices.push(service);
    }

    return {customerCount, services: newSelectedServices};
  };

  static servicesDiscount = (selectedServices, membership) => {};
}

module.exports = MembershipDiscount;
