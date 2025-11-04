const { Router } = require("express");
const fileController = require("../controllers/file");

const fileRouter = Router();

fileRouter.get("/:id/delete", fileController.fileDeleteGet);
fileRouter.get("/:id", fileController.fileGet);

module.exports = fileRouter;
