const { param, body } = require("express-validator");
const fileDB = require("../db/file");
const validator = require("./validator");
const authValidator = require("./auth-validator");
const path = require("node:path");

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

module.exports = {
  fileGet,
};
