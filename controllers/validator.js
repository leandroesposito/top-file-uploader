const { validationResult } = require("express-validator");

function checkValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.locals.errors = true;
    for (const error of errors.array()) {
      req.flash("error", error.msg);
    }
  }
  next();
}

module.exports = {
  checkValidation,
};
