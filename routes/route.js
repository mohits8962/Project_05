const express = require('express')
const router = express.Router();
const userController = require("../controller/userController")
const middleware = require("../middleware/middleware")


//User Apis
router.post("/register", userController.createUser)