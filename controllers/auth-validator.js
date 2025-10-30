function isAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    throw new Error("You must log in to continue");
  }
  next();
}
