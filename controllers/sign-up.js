const userDB = require("../db/user");
const { body } = require("express-validator");
const validator = require("./validator");
const bcrypt = require("bcryptjs");

const validateUser = [
  body("username").notEmpty(),
  body("username")
    .custom((value) => {
      return value.match(/[a-zA-Z0-9-_]+/)[0] === value;
    })
    .withMessage(
      "Username must contain only letters (a-z), numbers (0-9), hyphens (-), and underscores (_)."
    ),
  body("username")
    .isLength({ min: 4, max: 20 })
    .withMessage(
      "Username must contain at least 4 characters and at most 8 characters."
    ),
  body("username").custom(async (value) => {
    const user = await userDB.getUserByUsername(value);
    if (user) {
      throw new Error(`${username} is already used.`);
    }
    return true;
  }),
  body("password").notEmpty(),
  body("password")
    .custom((value, { req }) => {
      return value === req.body["confirm-password"];
    })
    .withMessage("Password and Confirm Password must be equal."),
];

function signUpGet(req, res) {
  res.render("sign-up.ejs", { title: "Sign up" });
}

const signUpPost = [
  validateUser,
  validator.checkValidation,
  async function (req, res) {
    const user = {
      username: req.body.username,
      password: req.body.password,
    };

    if (res.locals.errors) {
      return res.redirect("/sign-up");
    }

    user.password = await bcrypt.hash(user.password, 10);

    const newUser = await userDB.createUser(user);
    if (newUser) {
      req.flash("success", "User created successfuly"), res.redirect("/log-in");
    } else {
      req.flash("error", "Error creating user");
      res.redirect("/sign-up");
    }
  },
];

module.exports = {
  signUpGet,
  signUpPost,
};
