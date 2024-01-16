const Artist = require("../model/partnerApp/Artist");
const Review = require("../model/partnerApp/Review");
const Salon = require("../model/partnerApp/Salon");

const updateSalonRating = (salonId) => {
    return new Promise(async (resolve, reject) => {
        try{
            let salonData = await Salon.find({_id: salonId});
            salonData = salonData[0];
            let salonReviewsWithoutArtists = await Review.find({salonId: salonId, artistId: null});
            let salonReviewsWithArtists = await Review.find({salonId: salonId, artistId: {$not: {$eq: null}}});
            let salonRatingWithArtist = 0;
            let salonRatingWithoutArtist = 0
            if(!salonReviewsWithoutArtists.length){
                resolve({length: salonReviewsWithoutArtists.length, salonData});
            }else{
                if(salonReviewsWithArtists.length){
                    salonReviewsWithArtists.forEach(review => {
                        salonRatingWithArtist += review.rating;
                    })
                    salonRatingWithArtist = salonRatingWithArtist/salonReviewsWithArtists.length;
                }
                if(salonReviewsWithoutArtists.length){
                    salonReviewsWithoutArtists.forEach(review => {
                        salonRatingWithoutArtist += review.rating;
                    })
                    salonRatingWithoutArtist = salonRatingWithoutArtist/salonReviewsWithoutArtists.length;
                }
                salonData.rating = (salonRatingWithArtist*0.25) + (salonRatingWithoutArtist*0.75)
                await salonData.save();
                resolve({salonRatingWithArtist, salonRatingWithoutArtist,salonData});
            }
        }catch(err){
            reject(err);
        }
    })
}

const updateArtistRating = (artistId) => {
    return new Promise(async (resolve, reject) => {
        try{
            let artistData = await Artist.find({_id: artistId});
            artistData = artistData[0];
            let artistReviews = await Review.find({artistId: artistId});
            let artistRating = 0;
            if(artistReviews.length){
                artistReviews.forEach(review => {
                    artistRating += review.rating;
                })
                artistRating = artistRating/artistReviews.length;
            }
            artistData.rating = artistRating
            await artistData.save();
            resolve({artistRating, artistData});
        }catch(err){
            reject(err);
        }
    })
}

module.exports = {
    updateSalonRating,
    updateArtistRating
}
