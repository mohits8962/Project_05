const cartModel = require("../models/cartModel");
const productModel = require("../models/productsModels");
const userModel = require("../models/userModel");

const { isValidObjectId } = require("mongoose");



//Crate Cart Api
const addCart = async function (req, res) {
    try {
        
        let userId = req.params.userId;

        let data = req.body;
        let { productId, quantity } = data;

        productId = productId.trim();
        quantity = data.quantity;

        //body empty
        if (Object.keys(data).length == 0) {
            return res
                .status(400)
                .send({ status: false, message: "Provide the data" });
        }

        //Checking User validation
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" });
        }
        //user Authorization
        if (userId != req.userId) {
            return res
                .status(403)
                .send({ status: false, message: "Unauthorized Access" });
        }
        //user Exist or not
        let userExist = await userModel.findById(userId);
        if (!userExist) {
            return res
                .status(404)
                .send({ status: false, message: "No User Found With this Id" });
        }

        //quantity validation
        if (quantity <= 0) {
            return res.status(400).send({
                status: false,
                message: " If you want to add quantity, Please put more than Zero",
            });
        }

        if (!quantity) {
            quantity = 1;
            data["quantity"] = quantity;
        }
        if (typeof quantity != "number") {
            return res
                .status(400)
                .send({ status: false, message: "Quantity Should only Be Number" });
        }

        //Product Id Validation
        if (!data.productId.trim()) {
            return res
                .status(400)
                .send({ status: false, message: "Provide the Product Id " });
        }
        //valid or not
        if (!isValidObjectId(productId)) {
            return res
                .status(400)
                .send({ status: false, message: "Invalid Product Id" });
        }
        //exist or not
        let prodExist = await productModel.findById({
            _id: productId,
            isDeleted: false,
        });
        if (!prodExist) {
            return res.status(404).send({
                status: false,
                message: "Either Product is Deleted or Doesn't Exist",
            });
        }

        //total price and total items 
        let totalPrice = prodExist.price * data.quantity;
        let totalItems = 1;

        let isCart = await cartModel.findOne({ userId: userId });

        if (!isCart) {
            let newObj = {};

            //set product details
            let productDetails = {
                productId: productId,
                quantity: data.quantity,
            };

            //pushing product details in new array
            let items = [];
            items.push(productDetails);

            //set other details in the new object
            newObj["userId"] = userId;
            newObj["items"] = items;
            newObj["totalPrice"] = totalPrice;
            newObj["totalItems"] = totalItems;

            //creating new cart
            let createCart = await cartModel.create(newObj);

            return res.status(201).send({
                status: true,
                message: "Cart Created Succesfully",
                data: createCart,
            });

        } else {
            let flag = false;

            //checking items in the existing cart
            //if product exist in the item array, than increase the quantity
            for (let i = 0; i < isCart.items.length; i++) {
                if (isCart.items[i].productId == productId) {
                    isCart.items[i].quantity += quantity;
                    flag = true;
                    break;
                }
            }

            //if not than add the new product
            if (flag ==false) {
                let newProductDetails = {
                    productId: productId,
                    quantity: data.quantity,
                };
                isCart.items.push(newProductDetails);
            }

            //after adding new product or increase the same product's quantity, than set the price(if new product add than set the total items)
            isCart.totalPrice += totalPrice;
            isCart.totalItems = isCart.items.length;

            //updation part
            let addtoCart = await cartModel.findOneAndUpdate(
                { userId: userId },
                { $set: isCart },
                { new: true }
            );
            return res.status(200).send({
                status: true,
                message: "Product Added to Cart Successfully",
                data: addtoCart,
            });
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};



//Get Cart Api
const getCart = async (req, res) => {
    try {
        let userId = req.params.userId;

        //user Authorization
        if (userId != req.userId) {
            return res
                .status(403)
                .send({ status: false, message: "Unauthorized Access" });
        }
        //userId valid or not
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" });
        }
        //user exist or not
        let userExist = await userModel.findById(userId);
        if (!userExist) {
            return res
                .status(404)
                .send({ status: false, message: "No User Found With this Id" });
        }

        //if exist than send the details
        let isCart = await cartModel
            .findOne({ userId: userId })
            .populate("items.productId", { createdAt: 0, updatedAt: 0, __v: 0 });

        if (!isCart) {
            return res
                .status(404)
                .send({ status: false, message: "There Is Nothing In ur Cart" });
        } else {
            return res.status(200).send({ status: true, data: isCart });
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};


module.exports = {addCart,getCart}