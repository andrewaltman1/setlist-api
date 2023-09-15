import express, { Request, Response } from "express";
const router = express.Router();
const auth = require("../auth.js");
const { login } = require("../middleware");

// auth for new users is working but password reset funtionality needs to be implemented

router.post("/signup", auth.crypto);

router.post(
    "/login/password",
    auth.passport.authenticate("local", {
        failureRedirect: "/login",
        failureMessage: true,
    }),
    login
);

router.post("/logout", function (req, res, next) {
    req.logout();
    res.redirect("/");
});

module.exports = router;