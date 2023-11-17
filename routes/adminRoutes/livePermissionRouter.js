const router = require('express').Router();
const mongoose = require('mongoose');
const Salon = require('../../model/partnerApp/Salon');
const Artist = require('../../model/partnerApp/Artist')
const wrapperMessage = require('../../helper/wrapperMessage');

// Giving live permissions to the Salons
router.post('/live/salon', async (req, res) => {
    try{
        let {salonId, live} = req.body;
        let salon = await Salon.updateOne({_id: salonId}, {live: live});
        if(live){
            res.json(wrapperMessage("success", "Salon granted live permission", salon));
        }else{
            res.json(wrapperMessage("success", "Salon is not live anymore!", salon));
        }
    }catch(err){
        res.json(wrapperMessage("failed", err.message));
    }
})

router.post('/live/artist', async (req, res) => {
    try{
        let {artistId, salonId, live} = req.body;
        let artist = await Artist.findOne({_id: artistId});
        
        if(!artist){
            throw new Error ("Sorry, no such artist exists!");
        }
    
        if(artist.salonId.toString() !== salonId){
            throw new Error ("You can't change the permissions for this Artist!");
        }
        let data = await Artist.updateOne({_id: artistId}, {live: live});
        if(live){
            res.json(wrapperMessage("success", "Artist granted live permission"));
        }else{
            res.json(wrapperMessage("success", "Artist is not live anymore!"));
        }
    }catch(err){
        res.json(wrapperMessage("failed", err.message));
    }
})

module.exports = router;