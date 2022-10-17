const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      trim: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
          trim: true
        },
        _id: false,
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      trim: true,
    },
    totalItems: {
      type: Number,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);