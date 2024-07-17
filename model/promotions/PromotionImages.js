const mongoose = require('mongoose');

const promotionImagesSchema = new mongoose.Schema({
    salonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Salon',
        required: true
    },
    images: [
        {
            key: {
                type: String,
                required: true
            },
            url: {
                type: String,
                required: true
            }
        }
    ],
}, { timestamps: true });

const PromotionImages = mongoose.model('PromotionImage', promotionImagesSchema);

module.exports = PromotionImages;
