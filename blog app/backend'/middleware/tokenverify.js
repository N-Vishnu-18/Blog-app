const jwt = require('jsonwebtoken');
require('dotenv').config();

function verifyToken(req, res, next) {
    // Get bearer token from headers of req
    const bearerToken = req.headers.authorization;
    // If bearer token not available
    if (!bearerToken) {
        return res.send({ message: 'Unauthorized access. Please login to continue' }); // Adjusted message for clarity
    }
    // Extract token from bearer token
    const token = bearerToken.split(' ')[1];
    try {
        jwt.verify(token, process.env.SECRET_KEY);
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = verifyToken; // Changed from verifyToken to match function name for consistency
