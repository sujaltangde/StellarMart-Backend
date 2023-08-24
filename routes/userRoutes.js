const express = require('express')
const { registerUser, loginUser, forgotPassword, resetPassword, getUserDetails, isLogin, updatePassword, updateProfile, getAllUsers, getUser, updateUser, deleteUser } = require('../controllers/userConroller.js');
const { isAuthenticated, authorizationRoles } = require('../middleware/auth.js');

const router = express.Router()

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/password/forgot").post(forgotPassword)

router.route("/password/reset/:token").put(resetPassword)

router.route("/password/update").put(isAuthenticated, updatePassword)

router.route("/me").get(isAuthenticated, getUserDetails)

router.route("/isLogin").get(isAuthenticated, isLogin)

router.route("/me/update").put(isAuthenticated, updateProfile)

router.route("/admin/users").get(isAuthenticated, authorizationRoles("admin"), getAllUsers);

router.route("/admin/user/:id")
    .get(isAuthenticated, authorizationRoles("admin"), getUser)
    .put(isAuthenticated, authorizationRoles("admin"), updateUser)
    .delete(isAuthenticated, authorizationRoles("admin"), deleteUser)

module.exports = router
