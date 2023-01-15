const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    email : {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // cpassword: {
    //     type: String,
    //     required: true
    // },
    emailToken: {
        type: String,
    },
    isVerified: {
        type: Boolean,
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }]
})

// generating tokens
userSchema.methods.generateAuthUser = async function() {
    try {
        console.log(this._id);
        const token = jwt.sign({_id: this._id.toString()}, process.env.SECRET_KEY);
        this.tokens = this.tokens.concat({token});
        // await this.save();
        return token;
    } catch (error) {
        // res.send(`The error part ${error}`);
        console.log(`The error part ${error}`);
    }
}

// hashing password
userSchema.pre("save", async function(next) {
    this.password = await bcrypt.hash(this.password, 10);
    this.cpassword = undefined;
    next();
})

const Signup = new mongoose.model("user", userSchema);

module.exports = Signup;