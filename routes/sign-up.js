const { Router } = require("express");
const signUpController = require("../controllers/sign-up");

const signUpRouter = Router();

signUpRouter.get("/", signUpController.signUpGet);
signUpRouter.post("/", signUpController.signUpPost);

module.exports = signUpRouter;
