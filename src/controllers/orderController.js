const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel");
const userModel = require("../models/userModel");
const { isValidObjectId } = require("mongoose");


//Crate Order Api
const createOrder = async function (req, res) {
    try {

        let userId = req.params.userId;
        let data = req.body;
        let { cartId } = data;

        //body empty
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Provide the data" });
        }

        //User Validation
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" });
        }

        //User Authorization
        if (userId != req.userId) {
            return res.status(403).send({ status: false, message: "Unauthorized Access" });
        }

        //User exist or not
        const userExist = await userModel.findById(userId);
        if (!userExist) {
            return res.status(404).send({ status: false, message: "No User Found" });
        }
        data["userId"] = userId;

        //Cart Validation
        if (!data.cartId.trim()) {
            return res.status(400).send({ status: false, message: "Provide The CartId" });
        }

        //Cart valid or not
        cartId = cartId.trim();
        if (!isValidObjectId(cartId)) {
            return res.status(400).send({ status: false, message: "Invalid cartId" });
        }

        //cartId Exist or not
        let cartExist = await cartModel.findById(cartId);
        if (cartExist.items.length == 0) {
            return res.status(404).send({ status: false, message: "There Is No Items for Order In Ur Cart" });
        }

        if (cartExist) {
            data["totalPrice"] = cartExist.totalPrice;
            data["totalItems"] = cartExist.totalItems;
            let totalQuantity = 0;

            for (let i = 0; i < cartExist.items.length; i++) {
                totalQuantity += cartExist.items[i].quantity;
            }

            data["items"] = cartExist.items
            data["totalQuantity"] = totalQuantity;

            let orderCreated = await orderModel.create(data);
            if (orderCreated) {
                cartExist.items.splice(0);
                cartExist.totalItems = 0;
                cartExist.totalPrice = 0;
                await cartModel.findOneAndUpdate({ _id: cartId }, { $set: cartExist });
            }
            return res.status(201).send({ status: true, message: "Order Created SuccessFull", Order: orderCreated });
        }
        else {
            return res.status(404).send({ status: false, message: "No Cart Found" });
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};




//Update Order Api
const updateOrder = async (req, res) => {
    try {
        let userId = req.params.userId;
        let data = req.body;
        let { orderId, status } = data;

        //body empty
        if (Object.keys(data).length == 0) {
            return res.status(400).send({ status: false, message: "Provide The Data" });
        }

        //User Validation
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: "Invalid UserId" });
        }

        //user Authorization
        if (userId != req.userId) {
            return res.status(403).send({ status: false, message: "Unauthorized Access" });
        }
        //user exist or not
        const userExist = await userModel.findById(userId);
        if (!userExist) {
            return res.status(404).send({ status: false, message: "No User Found" });
        }

        //order validation
        if (!orderId) {
            return res.status(400).send({ status: false, message: "Provide The OrderId" });
        }

        //orderId valid or not
        if (!isValidObjectId(orderId)) {
            return res.status(400).send({ status: false, message: "Invalid OrderId" });
        }

        //orderId Exist or not
        let orderExist = await orderModel.findOne({ _id: orderId, isDeleted: false });
        if (!orderExist) {
            return res.status(404).send({ status: false, message: "There Is no order Exist" });
        }

        //userId checking from OrderId
        if (orderExist.userId != userId) {
            return res.status(403).send({ status: false, message: "Either this OrderId or userId is not Urs" });
        }

        //status validation
        if (!status) {
            return res.status(400).send({ status: false, message: "Provide The Status" });
        }

        availableStatus = status.replace(/\s+/g, "").split(",").map(String);
        let arr = ["completed", "canceled"];
        let flag;

        for (let i = 0; i < availableStatus.length; i++) {
            flag = arr.includes(availableStatus[i]);
        }

        if (!flag) {
            return res.status(400).send({
                status: false,
                data: "Enter a valid Status: completed or canceled",
            });
        }
        data["status"] = availableStatus;


        if (orderExist.cancellable == false) {
            return res.status(400).send({ status: false, message: "This Order Can't be cancelled" });
        } else {
            orderExist.status = status;
            let updated = await orderModel.findOneAndUpdate(
                { _id: orderId },
                { $set: orderExist },
                { new: true }
            );
            return res.status(200).send({ status: true, message: "order Updated", Order: updated });
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};


module.exports = { createOrder, updateOrder };