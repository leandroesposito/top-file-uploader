function isAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    throw new Error("You must log in to access this resource!");
  }
  next();
}

function isNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    req.flash("error", "You must log out to access this resource!");
    return res.redirect("/");
  }
  next();
}

module.exports = {
  isAuthenticated,
  isNotAuthenticated,
};
