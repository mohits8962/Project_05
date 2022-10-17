const userModel = require("../models/userModel");           //requiring model
//requiring all packages
const { isValidObjectId } = require("mongoose");
const aws1 = require("../aws/aws.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { isValidRequestBody,
    isValid,
    isValidEmail,
    isvalidPincode,
    isValidPassword,
    isValidPhone,
    isValidImg } = require("../validators/validators");


//Creating User API

const createUser = async function (req, res) {
    try {
        let data = req.body
        let file = req.files
        let { fname, lname, phone, email, password, address } = data

        // if body is empty---------------------------------------------------------
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please Provide User's Data" })
        }


        // Validating Names---------------------------------------------------------
        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "Provide the First Name Feild" });
        }

        if (!/^[a-zA-Z ]{2,30}$/.test(fname)) {
            return res.status(400).send({ status: false, message: "Enter valid Fname" });
        }

        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "Provide the Last Name Feild" });
        }

        if (!/^[a-zA-Z ]{2,30}$/.test(lname)) {
            return res.status(400).send({ status: false, message: "Enter valid Lname" });
        }


        //phone validation---------------------------------------------------------
        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "Phone Number Feild is Required" });
        }

        if (!isValidPhone(phone)) {
            return res.status(400).send({ status: false, message: "Phone Number should be a valid Indian Phone Number" });
        }

        let PhoneCheck = await userModel.findOne({ phone: phone.trim() });
        if (PhoneCheck) {
            return res.status(400).send({ status: false, message: `This No ${phone} is Already Registered` });
        }


        //email validation---------------------------------------------------------
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Provide the EmailId Feild" });
        }

        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Provide the Valid EmailId " });
        }

        let checkmail = await userModel.findOne({ email: email });
        if (checkmail) {
            return res.status(400).send({ status: false, message: `${email} is Already Registered` });
        }


        //password validation---------------------------------------------------------
        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "Provide the Password " });
        }

        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, message: "Password Length must be in btwn 8-15 chars only" });
        }


        //decrypted password create using "bcrypt package"---------------------------------------------------------
        const saltRounds = 10;
        const encryptedPassword = await bcrypt.hash(password, saltRounds);
        data["password"] = encryptedPassword;      // setting attribute


        //address validation---------------------------------------------------------
        if (address) {
            let objAddress = JSON.parse(address);     //converting text into a JavaScript object

            //shipping address validation part
            if (objAddress.shipping) {
                if (!isValid(objAddress.shipping.street)) {
                    return res.status(400).send({ status: false, message: "Please provide street name in shipping address" });
                }
                if (!isValid(objAddress.shipping.city))
                    return res.status(400).send({ status: false, message: "Please provide city name in shipping address" });

                if (!isvalidPincode(objAddress.shipping.pincode))
                    return res.status(400).send({ status: false, message: "Please provide pincode in shipping address" });
            } else {
                res.status(400).send({ status: false, message: "Please Provide Shipping Address In Address Feild" });
            }


            //billing address validation part
            if (objAddress.billing) {
                if (!isValid(objAddress.billing.street))
                    return res.status(400).send({ status: false, message: "Please provide street name in billing address" });

                if (!isValid(objAddress.billing.city))
                    return res.status(400).send({ status: false, message: "Please provide city name in billing address" });

                if (!isvalidPincode(objAddress.billing.pincode))
                    return res.status(400).send({ status: false, message: "Please provide pincode in billing address" });
            } else {
                return res.status(400).send({ status: false, message: "Please Provide Billing Address In Address Feild" });
            }

            //after checking both address validation, Than set the address data
            data["address"] = objAddress;

        } else {
            return res.status(400).send({ status: true, message: "Please Provide The Address" });
        }


        //Profile Image validation
        if (file.length == 0) {
            return res.status(400).send({ status: false, message: "Please Provide The Profile Image" })
        }

        if (file && file.length > 0) {
            if (!isValidImg(file[0].mimetype)) {
                return res.status(400).send({ status: false, message: "Image Should be of JPEG/ JPG/ PNG", });
            }

            //store the profile image in aws and creating profile image url via "aws package" 
            let newurl = await aws1.uploadFile(file[0]);
            data["profileImage"] = newurl;

        }

        //after checking all the validation,than creating the user data
        const created = await userModel.create(data);
        return res.status(201).send({ status: true, message: "User Created Succefully", data: created });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};



//Login User API

const loginUser = async function (req, res) {
    try {
        const data = req.body;
        const { email, password } = data;

        //request body empty or not
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please Enter Login Credentials" });
        }

        //emailId validation
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Email is Required" });
        }
        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Invalid Email Address" });
        }

        //password validation
        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "Password is Required" });
        }
        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, message: "Password Length should be in 8-15 chars only " });
        }

        //checking Login Credentials
        const user = await userModel.findOne({ email: email });
        if (!user) {
            return res.status(404).send({ status: false, message: "Invalid User, Login Credentials Doesn't Matched" });
        }

        //checking req body password and DB's decryptPassword is same or not using "bcrypt package"
        const decrypPassword = user.password;
        const pass = await bcrypt.compare(password, decrypPassword);
        if (!pass) {
            return res.status(400).send({ status: false, message: "Password Incorrect" });
        }

        // Creating Token Here
        const token = jwt.sign(
            { userId: user._id }, "Group-37/project-05",
            { expiresIn: "72hr" }
        );

        //restrucing response and set token 
        let obj = {
            userId: user._id,
            token: token,
        };

        res.setHeader("Authorization", token);

        return res.status(201).send({ status: true, message: "User LoggedIn Succesfully", data: obj });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};



//Get User API

const getUser = async function (req, res) {
    try {
        let userId = req.params.userId;

        //userId validation
        if (!userId) {
            return res.status(400).send({ status: false, message: "Provide UserID" });
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ stauts: false, message: "Invalid User Id" });
        }

        //authorization
        if (userId != req.userId) {
            return res.status(403).send({ status: false, message: "unauthorized access!" });
        }

        //if user exist than providing the user's data 
        const data = await userModel.find({ _id: userId });
        if (data) {
            return res.status(200).send({ status: true, message: 'Success', data: data });
        } else {
            return res.status(404).send({ status: false, message: `No Data Found by This Id ${userId}` });
        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};



const updateUserProfile = async function (req, res) {
    try {
        const userId = req.params.userId;
        const data = req.body;
        const file = req.files;
        let { fname, lname, phone, email, password, address } = data;

        //body is empty
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please provide data for update" });
        }

        //check userId via mongoose
        if (!isValidObjectId(userId)) {
            return res.status(400).send({ stauts: false, message: "Invalid User Id" });
        }

        //userId present or not
        const isUserPresent = await userModel.findById(userId);
        if (!isUserPresent) {
            return res.status(404).send({ status: false, message: "No User Found" });
        }

        //authorization
        if (userId != req.userId) {
            return res.status(403).send({ status: false, message: "unauthorized access!" });
        }

        // user details (to be updated) sent through request body, convert text into a JavaScript object
        //The hasOwnProperty() method returns true if the specified property is a direct property of the object — even if the value is null or undefined
        const bodyFromReq = JSON.parse(JSON.stringify(req.body));

        let newObj = {};

        //fname validation than updation
        if (bodyFromReq.hasOwnProperty("fname")) {
            if (!isValid(fname)) {
                return res.status(400).send({ status: false, message: "Provide the First Name " });
            }

            if (!/^[a-zA-Z ]{2,30}$/.test(fname)) {
                return res.status(400).send({ status: false, message: "Enter valid  fname" });
            }
            newObj["fname"] = fname;
        }

        //lname validation than updation
        if (bodyFromReq.hasOwnProperty("lname")) {
            if (req.body.lname.trim().length == 0) {
                return res.status(400).send({ status: false, message: "Provide the last Name " });
            }

            if (!/^[a-zA-Z ]{2,30}$/.test(lname)) {
                return res.status(400).send({ status: false, message: "Enter valid  lname" });
            }
            newObj["lname"] = lname;
        }

        //phone validation than updation
        if (bodyFromReq.hasOwnProperty("phone")) {
            if (!isValid(phone) || !isValidPhone(phone)) {
                return res.status(400).send({ status: false, message: "Please Provide valid Indian Phone Number" });
            }

            let PhoneCheck = await userModel.findOne({ phone: phone.trim() });
            if (PhoneCheck) {
                return res.status(400).send({ status: false, message: `This No ${phone} is Already Registered` });
            }
            newObj["phone"] = phone;
        }

        //email validation than updation
        if (bodyFromReq.hasOwnProperty("email")) {
            if (!isValid(email)) {
                return res.status(400).send({ status: false, message: "Provide the EmailId " });
            }

            if (!isValidEmail(email)) {
                return res.status(400).send({ status: false, message: "Provide the Valid EmailId " });
            }

            let checkmail = await userModel.findOne({ email: email });
            if (checkmail) {
                return res.status(400).send({ status: false, message: `${email} is Already Registered` });
            }
            newObj["email"] = email;
        }

        //password validation than updation
        if (bodyFromReq.hasOwnProperty("password")) {
            if (!isValid(password)) {
                return res.status(400).send({ status: false, message: "Provide the Password " });
            }

            if (!isValidPassword(password)) {
                return res.status(400).send({ status: false, message: "Password Length must be btwn 8-15 chars only" });
            }

            // checking if the old password is same as new password via "bcrypt Package"
            const oldPassword = isUserPresent.password
            const isSamePassword = await bcrypt.compare(password, oldPassword);
            // console.log(isSamePassword)
            if (isSamePassword) {
                return res.status(400).send({status: false, message: "Entered a new password, This is same as old password"});
            }

            //if it is new password, than create a new encryptedPassword via "bcrypt Package"
            const saltRounds = 10;
            const encryptedPassword = await bcrypt.hash(password, saltRounds);
            newObj["password"] = encryptedPassword;
        }

        //address validation
        if (bodyFromReq.hasOwnProperty("address")) {
            if (address) {
                let objAddress = JSON.parse(address);
                let userPresentAdd = isUserPresent.address;

                //shipping address validation than updation
                if (objAddress.shipping) {
                    if (objAddress.shipping.street) {
                        if (!isValid(objAddress.shipping.street)) {
                            return res.status(400).send({
                                status: false,
                                message: "Please provide street name in shipping address",
                            });
                        }
                        userPresentAdd.shipping.street = objAddress.shipping.street;
                    }

                    if (objAddress.shipping.city) {
                        if (!isValid(objAddress.shipping.city)) {
                            return res.status(400).send({
                                status: false,
                                message: "Please provide city name in shipping address",
                            });
                        }
                        if (!/^[a-zA-Z ]{2,30}$/.test(objAddress.shipping.city)) {
                            return res.status(400).send({
                                status: false,
                                message: "Enter valid  city name not a number",
                            });
                        }
                        userPresentAdd.shipping.city = objAddress.shipping.city;
                    }

                    if (objAddress.shipping.pincode) {
                        if (!isvalidPincode(objAddress.shipping.pincode)) {
                            return res.status(400).send({
                                status: false,
                                message: "Please provide pincode in shipping address",
                            });
                        }
                        userPresentAdd.shipping.pincode = objAddress.shipping.pincode;
                    }
                }

                //billing address validation than updation
                if (objAddress.billing) {
                    if (objAddress.billing.street) {
                        if (!isValid(objAddress.billing.street)) {
                            return res.status(400).send({
                                status: false,
                                message: "Please provide street name in billing address",
                            });
                        }
                        userPresentAdd.billing.street = objAddress.billing.street;
                    }

                    if (objAddress.billing.city) {
                        if (!isValid(objAddress.billing.city)) {
                            return res.status(400).send({
                                status: false,
                                message: "Please provide city name in billing address",
                            });
                        }
                        if (!/^[a-zA-Z ]{2,30}$/.test(objAddress.billing.city)) {
                            return res.status(400).send({
                                status: false,
                                message: "Enter valid  city name not a number",
                            });
                        }
                        userPresentAdd.billing.city = objAddress.billing.city;
                    }

                    if (objAddress.billing.pincode) {
                        if (!isvalidPincode(objAddress.billing.pincode)) {
                            return res.status(400).send({
                                status: false,
                                message: "Please provide pincode in billing address",
                            });
                        }
                        userPresentAdd.billing.pincode = objAddress.billing.pincode;
                    }
                }
                newObj["address"] = userPresentAdd;
            } else {
                return res
                    .status(400)
                    .send({ status: true, message: "Please Provide The Address" });
            }
        }

        //profile image validation and updation
        if (file) {
            if (file && file.length > 0) {
                if (!isValidImg(file[0].mimetype)) {
                    return res.status(400).send({ status: false, message: "Image Should be of JPEG/ JPG/ PNG" });
                }

                //store the profile image in aws and creating profile image url via "aws package" 
                let newurl = await aws1.uploadFile(file[0]);
                data["profileImage"] = newurl;
                newObj["profileImage"] = newurl;
            }
        } else {
            return res.status(400).send({ status: false, message: "Provide The Profile Image as u Have selected" });
        }

        //updation part
        const updateUser = await userModel.findByIdAndUpdate(
            { _id: userId },
            { $set: newObj },
            { new: true }
        );
        return res.status(200).send({ status: true, message: "User profile updated", data: updateUser });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};



module.exports = { createUser, loginUser, getUser, updateUserProfile };