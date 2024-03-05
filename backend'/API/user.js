//create user API app
const express = require("express");
const userRouter = express.Router(); // Changed from userApp to userRouter
const bcryptjs = require("bcryptjs");
const expressAsyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const verifyToken = require('../Middlewares/verifyToken');
require("dotenv").config();

let userCollection;
let articlesCollection; // Changed from articlescollection to articlesCollection

// Middleware to get userCollection and articlesCollection from the app
userRouter.use((req, res, next) => {
  userCollection = req.app.get("userscollection");
  articlesCollection = req.app.get("articlescollection");
  next();
});

// User registration route
userRouter.post(
  "/user",
  expressAsyncHandler(async (req, res) => {
    const newUser = req.body; // Changed from newUser to newUserObject
    const dbUser = await userCollection.findOne({ username: newUser.username });
    if (dbUser !== null) {
      res.send({ message: "User existed" });
    } else {
      const hashedPassword = await bcryptjs.hash(newUser.password, 6);
      newUser.password = hashedPassword;
      await userCollection.insertOne(newUser);
      res.send({ message: "User created" });
    }
  })
);

// User login route
userRouter.post(
  "/login",
  expressAsyncHandler(async (req, res) => {
    const userCred = req.body;
    const dbUser = await userCollection.findOne({ username: userCred.username });
    if (dbUser === null) {
      res.send({ message: "Invalid username" });
    } else {
      const status = await bcryptjs.compare(userCred.password, dbUser.password);
      if (status === false) {
        res.send({ message: "Invalid password" });
      } else {
        const signedToken = jwt.sign(
          { username: dbUser.username },
          process.env.SECRET_KEY,
          { expiresIn: '1d' }
        );
        res.send({
          message: "login success",
          token: signedToken,
          user: dbUser,
        });
      }
    }
  })
);

// Fetch articles route
userRouter.get(
  "/articles", verifyToken,
  expressAsyncHandler(async (req, res) => {
    const articlesCollection = req.app.get("articlescollection");
    const articlesList = await articlesCollection.find({ status: true }).toArray();
    res.send({ message: "articles", payload: articlesList });
  })
);

// Post comments route
userRouter.post(
  "/comment/:articleId", verifyToken,
  expressAsyncHandler(async (req, res) => {
    const userComment = req.body;
    const articleIdFromUrl = (+req.params.articleId);
    const result = await articlesCollection.updateOne(
      { articleId: articleIdFromUrl },
      { $addToSet: { comments: userComment } }
    );
    console.log(result);
    res.send({ message: "Comment posted" });
  })
);

// Export userRouter
module.exports = userRouter;
