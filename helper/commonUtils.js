class CommonUtils{
   
  static shu(){
    return 987;
  }
  static isEmail(email) {
     return /^\S+@\S+\.\S+$/i.test(email);
      }

 static isPhoneNumber(input) {
    return /^\d{10}$/.test(input); // Check if it consists of 10 digits
      }

}

module.exports = CommonUtils;