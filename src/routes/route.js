const express = require('express')
const router = express.Router();
const userController = require("../controllers/controller")
const middleware = require("../middlewares/middleware")


//User Apis
router.post("/register", userController.createUser)
router.post("/login", userController.loginUser)
router.get("/user/:userId/profile", middleware.authentication, userController.getUser)
router.put("/user/:userId/profile", middleware.authentication, userController.updateUserProfile);









router.all("/****", function (req, res) {
    return res.status(404).send({ status: false, msg: "Check whether the Endpoint is Correct or Not" })
})


module.exports = router;