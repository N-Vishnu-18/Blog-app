// Create author API app
const express = require('express');
const authorRouter = express.Router(); // Changed from authorApp to authorRouter
const expressAsyncHandler = require('express-async-handler');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const verifyToken = require('../Middlewares/verifyToken');

let authorsCollection;
let articlesCollection; // Changed from articlescollection to articlesCollection

// Middleware to get authorsCollection and articlesCollection from the app
authorRouter.use((req, res, next) => {
    authorsCollection = req.app.get('authorscollection');
    articlesCollection = req.app.get('articlescollection');
    next();
});

// Author registration route
authorRouter.post('/user', expressAsyncHandler(async (req, res) => {
    // Get user resource from client
    const newUser = req.body;
    // Check for duplicate user based on username
    const dbUser = await authorsCollection.findOne({ username: newUser.username });
    // If user found in db
    if (dbUser !== null) {
        res.send({ message: 'User existed' });
    } else {
        // Hash the password
        const hashedPassword = await bcryptjs.hash(newUser.password, 6);
        // Replace plain pw with hashed pw
        newUser.password = hashedPassword;
        // Create user
        await authorsCollection.insertOne(newUser);
        // Send res 
        res.send({ message: 'Author created' });
    }
}));

// Author login route
authorRouter.post('/login', expressAsyncHandler(async (req, res) => {
    // Get cred obj from client
    const userCred = req.body;
    // Check for username
    const dbUser = await authorsCollection.findOne({ username: userCred.username });
    if (dbUser === null) {
        res.send({ message: 'Invalid username' });
    } else {
        // Check for password
        const status = await bcryptjs.compare(userCred.password, dbUser.password);
        if (status === false) {
            res.send({ message: 'Invalid password' });
        } else {
            // Create jwt token and encode it
            const signedToken = jwt.sign({ username: dbUser.username }, process.env.SECRET_KEY, { expiresIn: '1d' });
            // Send res
            res.send({ message: 'login success', token: signedToken, user: dbUser });
        }
    }
}));

// Adding new article by author
authorRouter.post('/article', verifyToken, expressAsyncHandler(async (req, res) => {
    // Get new article from client
    const newArticle = req.body;
    console.log(newArticle);
    // Post to articles collection
    await articlesCollection.insertOne(newArticle);
    // Send res
    res.send({ message: 'New article created' });
}));

// Modify article by author
authorRouter.put('/article', verifyToken, expressAsyncHandler(async (req, res) => {
    // Get modified article from client
    const modifiedArticle = req.body;
    // Update by article id
    const result = await articlesCollection.updateOne({ articleId: modifiedArticle.articleId }, { $set: { ...modifiedArticle } });
    const latestArticle = await articlesCollection.findOne({ articleId: modifiedArticle.articleId });
    res.send({ message: 'Article modified', article: latestArticle });
}));

// Delete an article by article ID
authorRouter.put('/article/:articleId', verifyToken, expressAsyncHandler(async (req, res) => {
    // Get articleId from url
    const articleIdFromUrl = req.params.articleId;
    // Get article 
    const articleToDelete = req.body;
    // Update status of article to false
    await articlesCollection.updateOne({ articleId: articleIdFromUrl }, { $set: { ...articleToDelete, status: false } });
    res.send({ message: 'Article removed' });
}));

// Read articles of author
authorRouter.get('/articles/:username', verifyToken, expressAsyncHandler(async (req, res) => {
    // Get author's username from url
    const authorName = req.params.username;
    // Get articles whose status is true
    const articlesList = await articlesCollection.find({ status: true, username: authorName }).toArray();
    res.send({ message: 'List of articles', payload: articlesList });
}));

// Export authorRouter
module.exports = authorRouter;
