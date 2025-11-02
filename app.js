require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("./generated/prisma");
const passport = require("passport");
const LocalStrategy = require("./session/Strategy");
const path = require("node:path");
const flash = require("connect-flash");
const serializations = require("./session/serializations");

const PORT = process.env.PORT || 3000;

const signUpRouter = require("./routes/sign-up");
const logInRouter = require("./routes/log-in");
const uploadRouter = require("./routes/upload");
const folderRouter = require("./routes/folder");

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
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
app.use(passport.session());
passport.use(LocalStrategy);
passport.serializeUser(serializations.serializeUser);
passport.deserializeUser(serializations.deserializeUser);
app.use(flash());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use((req, res, next) => {
  res.locals.error = res.locals.error || [];
  res.locals.success = res.locals.success || [];

  res.locals.error = res.locals.error.concat(req.flash("error"));
  res.locals.success = res.locals.success.concat(req.flash("success"));

  next();
});

app.use("/sign-up", signUpRouter);
app.use("/log-in", logInRouter);
app.use("/upload", uploadRouter);
app.use("/folder", folderRouter);
app.use("/", (req, res) => {
  res.render("index.ejs");
});

app.listen(PORT, (error) => {
  if (error) {
    console.error(error);
    throw error;
  }
  console.log("Server listening on port ", PORT);
});
