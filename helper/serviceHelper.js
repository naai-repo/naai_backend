const Service = require("../model/partnerApp/Service");
const Artist = require("../model/partnerApp/Artist");

const getArtistsListGivingService = (name) => {
  return new Promise(async (resolve, reject) => {
    try {
      let services = await Service.find({
        category: { $regex: name, $options: "i" },
      });
      services = services.map((service) => service._id);
      let artistPromiseArr = [];
      services.forEach((service) => {
        artistPromiseArr.push(
          Artist.find({ services: { $elemMatch: { serviceId: service } } })
        );
      });
      let artistsArr = await Promise.all(artistPromiseArr);
      artistsArr = artistsArr.flat();
      let set = new Set();
      artistsArr.forEach((artist) => {
        set.add(artist._id.toString());
      });
      let artists = Array.from(set);
      resolve(artists);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  getArtistsListGivingService,
};
