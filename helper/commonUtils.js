const axios = require("axios");
const Service = require("../model/partnerApp/Service");

const R = 6378.1; // Earth's radius in km
const toRadians = (degree) => degree * (Math.PI / 180);

class CommonUtils {
  static isEmail(email) {
    return /^\S+@\S+\.\S+$/i.test(email);
  }

  static isPhoneNumber(input) {
    return /^\d{10}$/.test(input); // Check if it consists of 10 digits
  }

  static async sendOTPonNumber(phoneNumber, otp) {
    const body = {
      Text: `Dear User, Your login OTP to NAAI app is ${otp}. Please do not share with anyone. - NAAI.`,
      Number: phoneNumber,
      SenderId: process.env.SENDER_ID,
      DRNotifyUrl: "https://www.domainname.com/notifyurl",
      DRNotifyHttpMethod: "POST",
      Tool: "API",
    };
    // Sends SMS OTP to user.
    const data = await axios.post(
      `https://restapi.smscountry.com/v0.1/Accounts/${process.env.AUTH_KEY}/SMSes/`,
      body,
      {
        auth: {
          username: process.env.AUTH_KEY,
          password: process.env.AUTH_TOKEN,
        },
      }
    );
  }

  static addDiscountToServices(discount, services) {
    return new Promise((resolve, reject) => {
      for (let service of services) {
        let price = service.price;
        let basePrice = price - (price * discount) / 100;
        service.price = basePrice;
        service._doc.cutPrice = price;
        if (service.variables.length) {
          for (let variable of service.variables) {
            let price = variable.price;
            let basePrice = price - (price * discount) / 100;
            variable.price = basePrice;
            variable._doc.cutPrice = price;
          }
        }
      }
      resolve(services);
    });
  }

  static async updateDiscountedServicePrice(salonId, discount) {
    try {
      let services = await Service.find({salonId});
      let saveServicesPromiseArr = [];
      for (let service of services) {
        let cutPrice = service.cutPrice;
        let basePrice = cutPrice - (cutPrice * discount) / 100;
        service.basePrice = basePrice;
        if (service.variables.length) {
          for (let variable of service.variables) {
            let cutPrice = variable.variableCutPrice;
            let basePrice = cutPrice - (cutPrice * discount) / 100;
            variable.variablePrice = basePrice;
          }
        }
        saveServicesPromiseArr.push(service.save());
      }
      await Promise.all(saveServicesPromiseArr);
    } catch (err) {
      console.log(err);
    }
  }

  // Function to calculate distance between two points using haversine formula

  static haversine (lat1, lon1, lat2, lon2) { 
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
  
    return distance;
  };
}

module.exports = CommonUtils;
