const Booking = require("../model/partnerApp/Booking");
const Salon = require("../model/partnerApp/Salon");
const Service = require("../model/partnerApp/Service");

class FilterUtils {
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

  static async addAvgPriceData(list) {
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
                  then: "luxury",
                },
                { case: { $gte: ["$avgBasePrice", 1300] }, then: "premium" },
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
    return salonsData;
  }

  static async getScore(strategy, list, maxDistance, end) {
    let maxRating = 5;
    let maxDiscount = 50;
    let totalBookings = await Booking.find().count("bookings");
    let totalSalons = await Salon.find().count("salons");
    let avgBookings = totalBookings / totalSalons;
    list = await FilterUtils.addAvgPriceData(list);

    // Price points for each price type
    const pricePoints = {
      basic: 0.25,
      standard: 0.5,
      luxury: 0.75,
      premium: 1,
    };

    switch (strategy) {
      case "discount":
        for (let itr = 0; itr <= end; itr++) {
          let salon = list[itr];
          let discount =
            salon.discount >= maxDiscount ? maxDiscount : salon.discount;
          let score = 0;
          score =
            ((maxDistance - salon.distance) / maxDistance) * 0.4 +
            (discount / maxDiscount || 0) * 0.4 +
            (pricePoints[salon.priceType] || 0) * 0.1 +
            (salon.rating / maxRating || 0) * 0.1;

          if (salon.paid) {
            score += 0.2;
          }
          list[itr]["score"] = score;
        }
        return list;

      case "rating":
        for (let itr = 0; itr <= end; itr++) {
          let salon = list[itr];
          let discount =
            salon.discount >= maxDiscount ? maxDiscount : salon.discount;
          let score = 0;
          score =
            ((maxDistance - salon.distance) / maxDistance) * 0.4 +
            (salon.rating / maxRating || 0) * 0.4 +
            (pricePoints[salon.priceType] || 0) * 0.1 +
            (discount / maxDiscount || 0) * 0.1;

          if (salon.paid) {
            score += 0.2;
          }

          list[itr]["score"] = score;
        }
        return list;

      case "price":
        for (let itr = 0; itr <= end; itr++) {
          let salon = list[itr];
          let discount =
            salon.discount >= maxDiscount ? maxDiscount : salon.discount;
          let score = 0;
          score =
            ((maxDistance - salon.distance) / maxDistance) * 0.4 +
            (discount / maxDiscount || 0) * 0.1 +
            (pricePoints[salon.priceType] || 0) * 0.4 +
            (salon.rating / maxRating || 0) * 0.1;

          if (salon.paid) {
            score += 0.2;
          }
          list[itr]["score"] = score;
        }
        return list;

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
            (pricePoints[salon.priceType] || 0) * 0.07;

          if (salon.paid) {
            score += 0.2;
          }

          list[itr]["score"] = score;
        }
        return list;
    }
  }
}

module.exports = FilterUtils;
