const express = require("express");
const bodyParser = require("body-parser");
const route = require("../src/route/route");
const mongoose = require("mongoose");
const aws = require("aws-sdk")
const multer = require("multer")
const app = express();


app.use(bodyParser.json());
app.use(multer().any())
app.use(bodyParser.urlencoded({ extended: true }))


mongoose.connect("mongodb+srv://mohits8962:m26u72h8@group-37-database.f1gfhiv.mongodb.net/group-37?retryWrites=true&w=majority",
    { useNewUrlParser: true })
    .then(() => console.log("MongoDb is connected"))
    .catch((err) => console.log(err));


app.use("/", route);


app.listen(process.env.PORT || 3000, function () {
    console.log("Express app is running on " + " " + (process.env.PORT || 3000));
});