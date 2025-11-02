const { Router } = require("express");
const folderController = require("../controllers/folder");

const folderRouter = Router();

folderRouter.get("/{:id}", folderController.folderGet);
folderRouter.post("/", folderController.folderPost);

module.exports = folderRouter;
