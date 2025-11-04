const { Router } = require("express");
const folderController = require("../controllers/folder");

const folderRouter = Router();

folderRouter.post("/:id/rename", folderController.folderRenamePost);
folderRouter.get("/{:id}", folderController.folderGet);
folderRouter.post("/", folderController.folderPost);

module.exports = folderRouter;
