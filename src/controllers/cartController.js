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
            if (flag == false) {
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
const getCart = async function (req, res) {
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



//Update Cart Api
const updateCart = async function (req, res) {
    try {
        let data = req.body;
        let userId = req.params.userId;
        let { cartId, productId, removeProduct } = data;

        //body empty
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Provide the data" });
        }

        //Checking User
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" });
        }
        //user authorization
        if (userId != req.userId) {
            return res.status(403).send({ status: false, message: "Unauthorized Access" });
        }
        //user exist or not
        let userExist = await userModel.findById(userId);
        if (!userExist) {
            return res.status(404).send({ status: false, message: "No User Found With this Id" });
        }

        //product validation
        if (!productId) {
            return res.status(400).send({ status: false, message: "Provide the ProductId" });
        }
        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "Invalid ProductId" });
        }
        //product exist or not
        let product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).send({ status: false,message: `No Product Found With this ${productId}`});
        }

        //removeProduct key validation
        if (!(removeProduct || removeProduct == 0)) {
            return res.status(400).send({ status: false, message: "Provide the removeProduct Key" });
        }

        if (!(typeof removeProduct == "number")) {
            return res.status(400).send({ status: false, message: "Provide the removeProduct Key Should be in number only" });
        }

        if (!(removeProduct == 1 || removeProduct == 0)){
            return res.status(400).send({status: false,message: "RemoveProduct Key Should be Zero Or One"});
        }

        //cardId validation
        if (!cartId) {
            return res.status(400).send({ status: false, message: "Provide the carrId" });
        }
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Invalid cartId" });
        }

        let cartExist = await cartModel.findById(cartId);

        let flag = false;

        if (cartExist) {
            if (cartExist.items.length == 0) {
                return res.status(400).send({ status: false, message: "There is No Item in This Cart" });
            }

            for (let i = 0; i < cartExist.items.length; i++) {
                if (cartExist.items[i].productId == productId && cartExist.items[i].quantity > 0) {
                    if (removeProduct == 1) {
                        cartExist.items[i].quantity -= 1;
                        cartExist.totalPrice -= product.price;
                        if (cartExist.items[i].quantity == 0) {
                            cartExist.items.splice(i, 1);
                        }
                    } else if (removeProduct == 0) {
                        cartExist.totalPrice = cartExist.totalPrice - cartExist.items[i].quantity * product.price;
                        cartExist.items.splice(i, 1);
                    }
                    flag = true;

                    //updation part
                    cartExist.totalItems = cartExist.items.length;
                    let result = await cartModel.findOneAndUpdate(
                        { _id: cartId },
                        { $set: cartExist },
                        { new: true }
                    );
                    return res.status(200).send({
                        status: true,
                        message: "Your Cart is Updated",
                        data: result,
                    });
                }
            }
            if (flag == false) {
                return res.status(404).send({
                    status: false,
                    message: `There is no Product with this ${productId} or exist in ur cart`,
                });
            }
        } else {
            return res.status(404).send({ status: false, message: `There is No Cart with id  ${cartId} exist`});
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};


//Delete Cart Api
const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId;

        //user Authorization
        if (userId != req.userId) {
            return res.status(403).send({ status: false, message: "Unauthorizes Acces" });
        }
        //user valid or not
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" });
        }
        //user exist or not
        let userExist = await userModel.findById(userId);
        if (!userExist) {
            return res.status(404).send({ status: false, message: "No User Found With this Id" });
        }

        //cart validation
        let isCart = await cartModel.findOne({ userId: userId });
        if (!isCart) {
            return res.status(404).send({ status: false, message: "This Cart is Already Deleted" });
        } else {
            //cart deleting means array of items is empty, totalItems is 0, totalPrice is 0
            isCart.totalItems = 0;
            isCart.totalPrice = 0;
            isCart.items = [];

            let delCart = await cartModel.findOneAndUpdate(
                { userId: userId },
                { $set: isCart },
                { new: true }
            );
            return res.status(204).send({
                status: true,
                message: "Cart Deleted Succesfully",
                data: delCart,
            });
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

module.exports = { addCart, getCart, updateCart, deleteCart}