const { param, body } = require("express-validator");
const fileDB = require("../db/file");
const folderDB = require("../db/folder");
const validator = require("./validator");
const authValidator = require("./auth-validator");
const path = require("node:path");
const fs = require("node:fs");

const fileValidator = {
  fileExist: async (value, { req }) => {
    const file = await fileDB.getFileById(value);

    if (!file) {
      throw new Error(`File with id ${value} doesn't exist!`);
    }

    req.locals = { file };
    return true;
  },
  fileBelongsToUser: (req, res, next) => {
    if (req.locals?.file && req.user.id != req.locals.file.userId) {
      throw new Error("You don't have permission to access this file!");
    }
    next();
  },
};

const fileGet = [
  param("id").custom(fileValidator.fileExist),
  authValidator.isAuthenticated,
  fileValidator.fileBelongsToUser,
  validator.checkValidation,
  function fileGet(req, res, next) {
    if (res.locals.errors) {
      return res.redirect("/folder");
    }

    return res.download(
      path.join("./uploads", req.locals.file.filename),
      req.locals.file.originalname,
      (error) => {
        if (error) {
          next(error);
        }
      }
    );
  },
];

const fileDeleteGet = [
  param("id").custom(fileValidator.fileExist),
  authValidator.isAuthenticated,
  fileValidator.fileBelongsToUser,
  validator.checkValidation,
  async function fileDeleteGet(req, res, next) {
    if (res.locals.errors) {
      return res.redirect("/folder");
    }

    const filePath = path.join(
      __dirname,
      "../uploads",
      req.locals.file.filename
    );

    fs.unlink(filePath, async (error) => {
      if (error) {
        return next(error);
      }

      await fileDB.deleteFileById(req.locals.file.id);
      req.flash("success", "File delete successfuly");
      res.redirect("/folder");
    });
  },
];

const fileRenamePost = [
  authValidator.isAuthenticated,
  param("id").custom(fileValidator.fileExist),
  fileValidator.fileBelongsToUser,
  body("newName")
    .trim()
    .isLength({ min: 4, max: 100 })
    .withMessage("File name must be between 4 and 100 characters!")
    .custom(async (value, { req }) => {
      const parent = await folderDB.getFolderContent(req.locals.file.folderId);
      const file = parent.files.find((f) => f.originalname === value);
      if (file) {
        throw new Error("You already have a file with that name!");
      }
      return true;
    }),
  validator.checkValidation,
  async function fileRenamePost(req, res) {
    if (res.locals.errors) {
      return res.redirect("/folder");
    }

    const fileId = req.locals.file.id;
    const newName = req.body.newName;
    const file = await fileDB.renameFileById(fileId, newName);

    if (file.originalname === newName) {
      req.flash("success", "File renamed successfuly!");
    } else {
      req.flash("error", "Error renaming file!");
    }
    res.redirect("/folder");
  },
];

module.exports = {
  fileGet,
  fileDeleteGet,
  fileRenamePost,
};
