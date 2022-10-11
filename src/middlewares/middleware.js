const jwt = require("jsonwebtoken");

//Authentication & Authorization

const authentication = async function (req, res, next) {

    try {
        let tokenWithBearer = req.headers["authorization"];

        if (!tokenWithBearer) {
            return res.status(400).send({ status: false, msg: "token not found" });
        }
        let tokenArray = tokenWithBearer.split(" ");

        let token = tokenArray[1];

        let decodedtoken = jwt.verify(token, "Group-37/project-05");

        if (!decodedtoken) {
            return res.status(401).send({ status: false, msg: "invalid token" });
        }

        req.userId = decodedtoken.userId;
        next();

    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
};

module.exports = { authentication };