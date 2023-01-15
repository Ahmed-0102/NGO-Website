const jwt = require('jsonwebtoken');
const cookie = require('cookie-parser');
const User = require("../models/signup");

// const loginrequired = async (req,res,next) => {
//     const token = req.cookie['access-token']
//     if(token) {
//         const validatetoken = await jwt.verify(token, process.env.SECRET_KEY)
//         if(validatetoken) {
//             res.user = validatetoken.id
//             next()
//         }
//         else {
//             console.log('token expires');
//         }
//     }
//     else {
//         console.log('TOken not found');
//         res.redirect('login');
//     }
// }

const verifyEmail = async(req, res,  next) => {
    try {
        const user = await User.findOne({ email : req.body.email});
        if(user.isVerified) {
            console.log(user);
            next();
        }
        else {
            console.log("Please check your email to verify your account");
            res.render('login');
        }
    } catch (error) {
        console.log(error);
    }
}

module.exports = {verifyEmail}