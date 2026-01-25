import express from "express";
const router = express.Router();
import { cryptoMiddleware, passport } from "../auth.ts";

// auth for new users is working but password reset functionality needs to be implemented

router.post("/signup", cryptoMiddleware);

router.post(
    "/login/password",
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureMessage: true,
    }),
    (req, res) => {
        res.redirect("/");
    }
);

router.post("/logout", function (req, res, next) {
    req.logout(() => {
        res.redirect("/");
    });
});

export default router;