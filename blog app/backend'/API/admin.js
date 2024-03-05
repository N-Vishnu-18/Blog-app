// Create admin API app
const express = require('express');
const adminRouter = express.Router(); // Changed from adminApp to adminRouter

adminRouter.get('/test-admin', (req, res) => {
    res.send({ message: 'This is from admin API' }); // Adjusted message for clarity
});

// Export adminRouter
module.exports = adminRouter; // Changed from adminApp to adminRouter
