// const passport = require('passport');
// const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
// const Partner = require('../model/partnerApp/Partner');
// const jwt = require("jsonwebtoken");

// passport.serializeUser(function(user, done) {
//     done(null, user);
// });

// passport.deserializeUser(function(user, done) {
//         done(null, user);
// });


// passport.use(new GoogleStrategy({
//     clientID:     process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//     callbackURL: "http://localhost:8800/partner/user/auth/google/callback",
//     passReqToCallback   : true
//   },
//     async function(request, accessToken, refreshToken, profile, done) {
//     const partner = await Partner.findOne({email : profile.email});
//     if(!partner){
//         let data = {
//             name: profile.displayName,
//             email: profile.email
//         }
//         return done(null, data);
//     }else{
//         let user = {
//             id: partner._id,
//             name: partner.name,
//             email: partner.email,
//             phoneNumber: partner.phoneNumber,
//             admin: partner.admin,
//             verified: partner.verified,
//           };
//           const accessToken = jwt.sign(
//             user,
//             process.env.ACCESS_TOKEN_SECRET
//           );

//           user = { ...user, accessToken };
//         return done(null, user);
//     }
//   }
// ));