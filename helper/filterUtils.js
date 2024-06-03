const Artist = require("../model/partnerApp/Artist");
const Booking = require("../model/partnerApp/Booking");
const Salon = require("../model/partnerApp/Salon");
const Service = require("../model/partnerApp/Service");

class FilterUtils {
  static getPricePoints(order) {
    let pricePoints = {};
    if (order === "asc") {
      pricePoints = {
        basic: {
          lowest: 800,
          highest: 1000,
          value: 1,
        },
        standard: {
          value: 0.75,
          lowest: 1000,
          highest: 1150,
        },
        premium: {
          value: 0.5,
          lowest: 1150,
          highest: 1300,
        },
        luxury: {
          value: 0.25,
          lowest: 1300,
          highest: 1500,
        },
      };
    } else {
      pricePoints = {
        basic: {
          lowest: 800,
          highest: 1000,
          value: 0.25,
        },
        standard: {
          value: 0.5,
          lowest: 1000,
          highest: 1150,
        },
        premium: {
          value: 0.75,
          lowest: 1150,
          highest: 1300,
        },
        luxury: {
          value: 1,
          lowest: 1300,
          highest: 1500,
        },
      };
    }
    return pricePoints;
  }

  static aggregationForDiscount(
    geoNear,
    salonType,
    typePresent,
    discountMax = 100,
    discountMin = 0,
    ratingMax = 5,
    ratingMin = 0
  ) {
    const aggregation = [
      ...geoNear,
      {
        $match: {
          live: true,
        },
      },
      {
        $match: {
          $or: [
            { salonType: salonType },
            { salonType: "unisex" },
            {
              $and: [
                { randomFieldToCheck: { $exists: typePresent } },
                {
                  $or: [
                    { salonType: "male" },
                    { salonType: "female" },
                    { salonType: "unisex" },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        $match: {
          $and: [
            {
              discount: {
                $gte: discountMin,
              },
            },
            {
              discount: {
                $lt: discountMax,
              },
            },
          ],
        },
      },
      {
        $match: {
          $and: [
            {
              rating: {
                $gte: ratingMin,
              },
            },
            {
              rating: {
                $lte: ratingMax,
              },
            },
          ],
        },
      },
    ];
    return aggregation;
  }

  static aggregationForArtists(
    geoNear,
    targetGender,
    typePresent,
    ratingMax = 5,
    ratingMin = 0
  ) {
    const aggregation = [
      ...geoNear,
      {
        $match: {
          live: true,
        },
      },
      {
        $match: {
          $or: [
            { targetGender: targetGender },
            { targetGender: "unisex" },
            {
              $and: [
                { randomFieldToCheck: { $exists: typePresent } },
                {
                  $or: [
                    { targetGender: "male" },
                    { targetGender: "female" },
                    { targetGender: "unisex" },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        $match: {
          $and: [
            {
              rating: {
                $gte: ratingMin,
              },
            },
            {
              rating: {
                $lte: ratingMax,
              },
            },
          ],
        },
      },
    ];
    return aggregation;
  }

  static async addAvgPriceData(list, priceTags) {
    let salonIdsToFilter = list.map((salon) => salon._id);
    const aggregation = [
      {
        $match: {
          salonId: { $in: salonIdsToFilter }, // Filter services based on the specified salonIds
        },
      },
      {
        $group: {
          _id: "$salonId",
          totalServices: { $sum: 1 }, // Count services for each salon
          totalBasePrice: { $sum: "$basePrice" },
          avgBasePrice: { $avg: "$basePrice" }, // Sum base prices for each salon
        },
      },
      {
        $project: {
          _id: 1,
          totalServices: 1,
          totalBasePrice: 1,
          avgBasePrice: 1,
          priceType: {
            // Add salonType to the result
            $switch: {
              branches: [
                { case: { $lt: ["$avgBasePrice", 1000] }, then: "basic" },
                {
                  case: {
                    $and: [
                      { $gte: ["$avgBasePrice", 1000] },
                      { $lt: ["$avgBasePrice", 1150] },
                    ],
                  },
                  then: "standard",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$avgBasePrice", 1150] },
                      { $lt: ["$avgBasePrice", 1300] },
                    ],
                  },
                  then: "premium",
                },
                { case: { $gte: ["$avgBasePrice", 1300] }, then: "luxury" },
              ],
            },
          },
        },
      },
    ];
    let salonAvgServicePrice = await Service.aggregate(aggregation);
    let salonsData = list.map((obj) => {
      let salonId = obj._id;
      let extraData = salonAvgServicePrice.find((item) =>
        salonId.equals(item._id)
      );
      if (!extraData) {
        extraData = {
          totalServices: 0,
          totalBasePrice: 0,
          avgBasePrice: 0,
          priceType: "basic",
        };
      }

      return { ...obj, ...extraData };
    });

    if (priceTags.length !== 0) {
      salonsData = salonsData.filter((salon) =>
        priceTags.includes(salon.priceType.toLowerCase())
      );
    }

    return salonsData;
  }

  static async addPriceTagToArtists(list, priceTags) {
    let salonIdsToFilter = list.map((artist) => artist.salonId);

    const aggregation = [
      {
        $match: {
          salonId: { $in: salonIdsToFilter }, // Filter services based on the specified salonIds
        },
      },
      {
        $group: {
          _id: "$salonId",
          totalServices: { $sum: 1 }, // Count services for each salon
          totalBasePrice: { $sum: "$basePrice" },
          avgBasePrice: { $avg: "$basePrice" }, // Sum base prices for each salon
        },
      },
      {
        $project: {
          _id: 1,
          avgBasePrice: 1,
          priceType: {
            // Add salonType to the result
            $switch: {
              branches: [
                { case: { $lt: ["$avgBasePrice", 1000] }, then: "basic" },
                {
                  case: {
                    $and: [
                      { $gte: ["$avgBasePrice", 1000] },
                      { $lt: ["$avgBasePrice", 1150] },
                    ],
                  },
                  then: "standard",
                },
                {
                  case: {
                    $and: [
                      { $gte: ["$avgBasePrice", 1150] },
                      { $lt: ["$avgBasePrice", 1300] },
                    ],
                  },
                  then: "premium",
                },
                { case: { $gte: ["$avgBasePrice", 1300] }, then: "luxury" },
              ],
            },
          },
        },
      },
    ];
    let salonAvgServicePrice = await Service.aggregate(aggregation);
    let artistData = list.map((obj) => {
      let salonId = obj.salonId;
      let extraData = salonAvgServicePrice.find((item) =>
        salonId.equals(item._id)
      );

      if (!extraData) {
        extraData = {
          avgBasePrice: 0,
          priceType: "basic",
        };
      }

      return {
        ...obj,
        priceType: extraData.priceType,
        avgBasePrice: extraData.avgBasePrice,
      };
    });
    if (priceTags.length !== 0) {
      artistData = artistData.filter((artist) =>
        priceTags.includes(artist.priceType.toLowerCase())
      );
    }
    return artistData;
  }

  static async getScore(strategy, list, order, priceTags) {
    let maxRating = 5;
    let maxDiscount = 50;
    let totalBookings = await Booking.find().count("bookings");
    let totalSalons = await Salon.find().count("salons");
    let avgBookings = totalBookings / totalSalons;
    list = await FilterUtils.addAvgPriceData(list, priceTags);
    // Price points for each price type
    const pricePoints = FilterUtils.getPricePoints(order);
    let maxDistance = 0;
    let end = 0;
    if (list.length < 1000) {
      maxDistance = list[list.length - 1].distance;
      end = list.length - 1;
    } else {
      maxDistance = list[1000].distance;
      end = 1000;
    }

    switch (strategy) {
      case "discount":
        for (let itr = 0; itr <= end; itr++) {
          let salon = list[itr];
          let discount =
            salon.discount >= maxDiscount ? maxDiscount : salon.discount;
          let avgPrice = 0;
          if (salon.avgBasePrice < pricePoints[salon.priceType].lowest) {
            avgPrice = pricePoints[salon.priceType].lowest;
          } else if (
            salon.avgBasePrice > pricePoints[salon.priceType].highest
          ) {
            avgPrice = pricePoints[salon.priceType].highest;
          } else {
            avgPrice = salon.avgBasePrice;
          }
          let score = 0;
          score =
            ((maxDistance - salon.distance) / maxDistance) * 0.4 +
            (discount / maxDiscount || 0) * 0.4 +
            (pricePoints[salon.priceType].value || 0) * 0.1 +
            ((avgPrice - pricePoints[salon.priceType].lowest) /
              (pricePoints[salon.priceType].highest -
                pricePoints[salon.priceType].lowest)) *
              0.1 +
            (salon.rating / maxRating || 0) * 0.1;

          if (salon.paid) {
            score += 0.2;
          }
          list[itr]["score"] = score;
        }
        return { salons: list, end };

      case "rating":
        for (let itr = 0; itr <= end; itr++) {
          let salon = list[itr];
          let discount =
            salon.discount >= maxDiscount ? maxDiscount : salon.discount;
          let avgPrice = 0;
          if (salon.avgBasePrice < pricePoints[salon.priceType].lowest) {
            avgPrice = pricePoints[salon.priceType].lowest;
          } else if (
            salon.avgBasePrice > pricePoints[salon.priceType].highest
          ) {
            avgPrice = pricePoints[salon.priceType].highest;
          } else {
            avgPrice = salon.avgBasePrice;
          }
          let score = 0;
          score =
            ((maxDistance - salon.distance) / maxDistance) * 0.4 +
            (salon.rating / maxRating || 0) * 0.4 +
            (pricePoints[salon.priceType].value || 0) * 0.1 +
            (discount / maxDiscount || 0) * 0.1 +
            ((avgPrice - pricePoints[salon.priceType].lowest) /
              (pricePoints[salon.priceType].highest -
                pricePoints[salon.priceType].lowest)) *
              0.1;

          if (salon.paid) {
            score += 0.2;
          }

          list[itr]["score"] = score;
        }
        return { salons: list, end };

      case "price":
        for (let itr = 0; itr <= end; itr++) {
          let salon = list[itr];
          let discount =
            salon.discount >= maxDiscount ? maxDiscount : salon.discount;
          let avgPrice = 0;
          if (salon.avgBasePrice < pricePoints[salon.priceType].lowest) {
            avgPrice = pricePoints[salon.priceType].lowest;
          } else if (
            salon.avgBasePrice > pricePoints[salon.priceType].highest
          ) {
            avgPrice = pricePoints[salon.priceType].highest;
          } else {
            avgPrice = salon.avgBasePrice;
          }

          let score = 0;
          score =
            ((maxDistance - salon.distance) / maxDistance) * 0.4 +
            (discount / maxDiscount || 0) * 0.1 +
            (pricePoints[salon.priceType].value || 0) * 0.4 +
            (salon.rating / maxRating || 0) * 0.1 +
            ((avgPrice - pricePoints[salon.priceType].lowest) /
              (pricePoints[salon.priceType].highest -
                pricePoints[salon.priceType].lowest)) *
              0.1;

          if (salon.paid) {
            score += 0.2;
          }
          list[itr]["score"] = score;
        }
        return { salons: list, end };

      default:
        for (let itr = 0; itr <= end; itr++) {
          let salon = list[itr];
          let bookings =
            salon.bookings >= avgBookings ? avgBookings : salon.bookings;
          let discount =
            salon.discount >= maxDiscount ? maxDiscount : salon.discount;
          let score = 0;
          score =
            ((maxDistance - salon.distance) / maxDistance) * 0.5 +
            (discount / maxDiscount || 0) * 0.25 +
            (salon.rating / maxRating || 0) * 0.1 +
            (bookings / avgBookings || 0) * 0.08 +
            (pricePoints[salon.priceType].value || 0) * 0.07;

          if (salon.paid) {
            score += 0.2;
          }

          list[itr]["score"] = score;
        }
        return { salons: list, end };
    }
  }

  static async getScoreForArtists(strategy, list, order, priceTags) {
    let maxRating = 5;
    let totalBookings = await Booking.find().count("val");
    let totalArtists = await Artist.find().count("artist");
    let avgBookings = totalBookings / totalArtists;
    list = await FilterUtils.addPriceTagToArtists(list, priceTags);

    const pricePoints = FilterUtils.getPricePoints(order); // Price points for each price type
    let maxDistance = 0;
    let end = 0;

    if (list.length < 1000) {
      maxDistance = list[list.length - 1].distance;
      end = list.length - 1;
    } else {
      maxDistance = list[1000].distance;
      end = 1000;
    }

    switch (strategy) {
      case "rating":
        for (let itr = 0; itr <= end; itr++) {
          let artist = list[itr];
          let avgPrice = 0;
          if (artist.avgBasePrice < pricePoints[artist.priceType].lowest) {
            avgPrice = pricePoints[artist.priceType].lowest;
          } else if (
            artist.avgBasePrice > pricePoints[artist.priceType].highest
          ) {
            avgPrice = pricePoints[artist.priceType].highest;
          } else {
            avgPrice = artist.avgBasePrice;
          }
          let score = 0;
          score =
            ((maxDistance - artist.distance) / maxDistance) * 0.4 +
            (artist.rating / maxRating) * 0.4 +
            (pricePoints[artist.priceType].value || 0) * 0.1 +
            ((avgPrice - pricePoints[artist.priceType].lowest) /
              (pricePoints[artist.priceType].highest -
                pricePoints[artist.priceType].lowest)) *
              0.1;

          if (artist.paid) {
            score += 0.2;
          }

          list[itr]["score"] = score;
        }
        return { artists: list, end };

      case "price":
        for (let itr = 0; itr <= end; itr++) {
          let artist = list[itr];
          let avgPrice = 0;
          if (artist.avgBasePrice < pricePoints[artist.priceType].lowest) {
            avgPrice = pricePoints[artist.priceType].lowest;
          } else if (
            artist.avgBasePrice > pricePoints[artist.priceType].highest
          ) {
            avgPrice = pricePoints[artist.priceType].highest;
          } else {
            avgPrice = artist.avgBasePrice;
          }
          let score = 0;
          score =
            ((maxDistance - artist.distance) / maxDistance) * 0.4 +
            (pricePoints[artist.priceType].value || 0) * 0.4 +
            ((avgPrice - pricePoints[artist.priceType].lowest) /
              (pricePoints[artist.priceType].highest -
                pricePoints[artist.priceType].lowest)) *
              0.1 +
            (artist.rating / maxRating || 0) * 0.1;

          if (artist.paid) {
            score += 0.2;
          }
          list[itr]["score"] = score;
        }
        return { artists: list, end };

      default:
        for (let itr = 0; itr <= end; itr++) {
          let artist = list[itr];
          let bookings =
            artist.bookings >= avgBookings ? avgBookings : artist.bookings;
          let score = 0;
          score =
            ((maxDistance - artist.distance) / maxDistance) * 0.5 +
            (artist.rating / maxRating) * 0.3 +
            ((bookings / avgBookings) || 0) * 0.2;

          if (artist.paid) {
            score += 0.2;
          }

          list[itr]["score"] = score;
        }
        return { artists: list, end };
    }
  }
}

module.exports = FilterUtils;
