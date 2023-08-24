const mongoose = require('mongoose')
const validator = require('validator')
const crypto = require("crypto")
const bcrypt = require("bcrypt")


const userSchema = new mongoose.Schema({

    name:{
        type: String,
        required: [true, "Please enter your name"],
        maxLength:[30, "Name cannot exceed 30 charecters"],
        minLenght: [4,"Name should have more than 4 charecters"],
    },
    email:{
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        validate:[validator.isEmail, "Please enter a valid email"],
    },
    password:{
        type: String,
        required: [true, "Please enter a apassword"]
    },
    avtar:[
        {
            public_id:{
                type: String,
                required: true,
            },
            url:{
                type: String,
                required: true,
            },
        }
    ],
    role:{
        type: String,
        default: "user"
    },
    createdAt:{
        type: Date,
        default: Date.now
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date
})






// Genrating Password Reset Token
userSchema.methods.getResetPasswordToken = function() {

    // Generating Token
    const resetToken = crypto.randomBytes(20).toString("hex") ;
    
    // Hashing and adding resetPasswordToken to userSchema
    this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    this.resetPasswordExpire = Date.now() + 15 * 60 * 1000 ;

    return resetToken ;

}



const User = mongoose.model("User",userSchema)
module.exports = User ;