const express = require('express')
const router = express.Router();
const userController = require("../controllers/userController")
const productController = require("../controllers/productsController")
const cartController = require("../controllers/cartController")
const middleware = require("../middlewares/middleware")


//User Apis
router.post("/register", userController.createUser)
router.post("/login", userController.loginUser)
router.get("/user/:userId/profile", middleware.authentication, userController.getUser)
router.put("/user/:userId/profile", middleware.authentication, userController.updateUserProfile);

//Product Api's
router.post("/products", productController.createProducts)
router.get("/products", productController.getProductByFilter)
router.get("/products/:productId", productController.getProductById)
router.put("/products/:productId", productController.updateProduct)
router.delete("/products/:productId", productController.deleteProductById)

//cart Apis
router.post("/users/:userId/cart", middleware.authentication, cartController.addCart)
router.get("/users/:userId/cart", middleware.authentication, cartController.getCart)






router.all("/****", function (req, res) {
    return res.status(404).send({ status: false, msg: "Check whether the Endpoint is Correct or Not" })
})


module.exports = router;