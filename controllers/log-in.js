const passport = require("passport");
const authValidator = require("./auth-validator");

const logInGet = [
  authValidator.isNotAuthenticated,
  function logInGet(req, res) {
    res.render("log-in.ejs", { title: "Log in" });
  },
];

const logInPost = [
  authValidator.isNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    successFlash: "Welcome",
    failureRedirect: "/log-in",
    failureFlash: true,
  }),
];

module.exports = {
  logInGet,
  logInPost,
};
