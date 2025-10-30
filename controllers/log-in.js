const passport = require("passport");

function logInGet(req, res) {
  res.render("log-in.ejs", { title: "Log in" });
}

const logInPost = passport.authenticate("local", {
  successRedirect: "/",
  successFlash: "Welcome",
  failureRedirect: "/log-in",
  failureFlash: true,
});

module.exports = {
  logInGet,
  logInPost,
};
