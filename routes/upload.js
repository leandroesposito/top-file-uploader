const { Router } = require("express");
const uploadController = require("../controllers/upload");

const uploadRouter = Router();

uploadRouter.get("/", uploadController.uploadGet);
uploadRouter.post("/{:folderId}", uploadController.uploadPost);

module.exports = uploadRouter;
