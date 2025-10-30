require("dotenv").config();
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("./session/Strategy");
const path = require("node:path");
const flash = require("connect-flash");

const PORT = process.env.PORT || 3000;

const signUpRouter = require("./routes/sign-up");

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
  })
);
app.use(passport.session());
app.use(flash());

app.use((req, res, next) => {
  res.locals.error = res.locals.error || [];
  res.locals.success = res.locals.success || [];

  res.locals.error = res.locals.error.concat(req.flash("error"));
  res.locals.success = res.locals.success.concat(req.flash("success"));

  next();
});

app.use("/sign-up", signUpRouter);

app.listen(PORT, (error) => {
  if (error) {
    console.error(error);
    throw error;
  }
  console.log("Server listening on port ", PORT);
});
