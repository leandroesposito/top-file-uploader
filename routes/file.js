const { Router } = require("express");
const fileController = require("../controllers/file");

const fileRouter = Router();

fileRouter.get("/:id/delete", fileController.fileDeleteGet);
fileRouter.post("/:id/rename", fileController.fileRenamePost);
fileRouter.get("/:id", fileController.fileGet);

module.exports = fileRouter;
