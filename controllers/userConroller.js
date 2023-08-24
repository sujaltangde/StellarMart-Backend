const User = require('../models/userModel.js')
const bcrypt = require('bcrypt')
const { createToken } = require('../middleware/auth.js')
const sendEmail = require('../utils/sendEmail.js')
const crypto = require("crypto")
const cloudinary = require('cloudinary')



// Register User 
exports.registerUser = async (req, res, next) => {
    try {

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar,{
            folder: 'avatars',
            width: 150,
            crop: "scale",
        })

        const { name, email, password } = req.body;
        
		const hashPass = await bcrypt.hash(password, 10)
        const user = await User.create({
            name,
            email,
            password: hashPass,
            avtar: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            }
        });

        const userId = user._id;
        const userEmail = user.email;
        const token = await createToken(userId, userEmail);

        res.status(201).json({
            success: true,
            user,
            token
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


// Login User
exports.loginUser = async (req, res) => {
    try {   
    
       
        const { email, password } = req.body;
     

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please enter email and password'
            })
        }
      
        const user = await User.findOne({ email });
     
        if (!user) {
           return res.status(401).json({
                success: false,
                message: "User does not exists"
            })
        }
      
        const isMatch = await bcrypt.compare(password,user.password)
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Wrong credentials"
            })
        } else {
         
            const userId = user._id;

            const email = user.email;
           
            const token = createToken(userId, email);
         
            res.status(200).json({
                success: true,
                message: "User loggded in successfull",
                token
            })
        }

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

// Forgot Password
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        // Get ResetPassword Token
        const resetToken = user.getResetPasswordToken();

        await user.save({ validateBeforeSave: false })


        const resetPasswordUrl = `${req.protocol}://${req.get("host")}/api/v1/password/reset/${resetToken}`

        const message = `Your password reset token is :- \n\n ${resetPasswordUrl} \n\nIf you have not requrested this email then, please ignore it`;

        try {
            await sendEmail({
                email: user.email,
                subject: "StellarMart Password Recovery",
                message,
            })

            res.status(200).json({
                success: true,
                message: `Email send to ${user.email} successfully`
            })

        } catch (err) {
            user.resetPasswordToken = undefined
            user.resetPasswordExpire = undefined
            await user.save({ validateBeforeSave: false })

            return res.status(500).json({
                success: false,
                message: err.message
            })
        }



    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


// Reset Password 
exports.resetPassword = async (req, res) => {
    try {
        // Creating token hash
        const resetPasswordToken = crypto.createHash("sha256")
            .update(req.params.token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Reset Password Token is invalid or hash been expired"
            })
        }

        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Password does not match"
            })
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined
        user.resetPasswordExpire = undefined
        await user.save()

        const token = createToken(user._id, user.email);

        res.status(200).json({
            success: true,
            message: "Passowrd changed successfully",
            token
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }


}


// Get User Details
exports.getUserDetails = async (req,res) => {
    try{
        const user = await User.findById(req.user._id) ;


        res.status(200).json({
            success: true,
            user
        })

    }catch(err){
        res.status(200).json({
            success: false,
            message: err.message
        })
    }
}


// Logged in or not
exports.isLogin = async (req,res) => {
    try{
        const user = await User.findById(req.user._id) ;

        if(user){
            return res.status(200).json({
                success: true,
                isLogin: true
            })
        }
        if(!user){
            return res.status(200).json({
                success: true,
                isLogin: false
            })
        }

    }catch(err){
            res.status(500).json({
                success: false,
                message: err.message
            })
    }
} 


// Update User Password
exports.updatePassword = async (req,res) => { 
    try{
        const user = await User.findById(req.user.id) ;

        const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Old Password is incorrect"
            })
            
        } 

        if(req.body.newPassword !== req.body.confirmPassword){
            return res.status(400).json({
                success: false,
                message: "Password does not match"
            })
        } 

             const hashPass = await bcrypt.hash(req.body.newPassword,10) ;
             user.password = hashPass ;

             await user.save() ;
        
            const userId = user._id;
            const email = user.email;

            const token = await createToken(userId, email);

            res.status(200).json({
                success: true,
                message: "Password Updated successfully",
                token
            })      


    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


// Update User Profile
exports.updateProfile = async (req,res) => {
    try{    

        const logUser = await User.findById(req.user._id) ;
        const imageId = logUser.avtar[0].public_id ;

        await cloudinary.v2.uploader.destroy(imageId)

        const { newName , newEmail, newImage} = req.body ;
        const myCloud = await cloudinary.v2.uploader.upload(newImage,{
            folder: 'avatars',
            width: 150,
            crop: "scale",
        })
        const newUserData = {
            name: newName,
            email: newEmail,
            avtar: {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            }
            
        }
    
    
        const user = await User.findByIdAndUpdate(req.user._id,newUserData,{
            new: true,
            runValidators: true,
            useFindAndModify: false
        }) ;

        await user.save() ;

        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user
        })        
        
        
    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


// Get All Users --Admin
exports.getAllUsers = async (req,res) => {
    try{
        const AllUsers = await User.find() ;
        
        res.status(200).json({
            success: true,
            AllUsers
        })
    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}


// Get User Details -- Admin
exports.getUser = async (req,res) => {
    try{
          const user = await User.findById(req.params.id) ;

          if(!user){
            return res.status(404).json({
                success: false,
                message: "User does not exists"
            })
          }

          res.status(200).json({
            success: true,
            user
          })
    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

// Update User
exports.updateUser = async (req,res) => {
    try{
        const user = await User.findById(req.params.id) ;

        if(!user){
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        user.role = req.body.role ;
        await user.save() ;

        res.status(200).json({
            success: true,
            message: `User role changed to ${user.role}`
        })

    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}

// Delete User
exports.deleteUser = async (req,res) => {
    try{
        const user = await User.findById(req.params.id) ;

        // We will remove cloudinary later

        if(!user){
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }


        const imageId = user.avtar[0].public_id ;

        await cloudinary.v2.uploader.destroy(imageId)


        const deletedUser = await User.findByIdAndRemove(req.params.id) ;
        
        res.status(200).json({
            success: true,
            message: "User Deleted Successfully",
            deletedUser
        })


    }catch(err){
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
}