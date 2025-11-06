const { param, body } = require("express-validator");
const fileDB = require("../db/file");
const folderDB = require("../db/folder");
const validator = require("./validator");
const authValidator = require("./auth-validator");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASEURL,
  process.env.SUPABASEAPIKEY
);

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

    return res.redirect(req.locals.file.url);
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

    const { data, error } = await supabase.storage
      .from("uploads")
      .remove([req.locals.file.path]);

    if (error) {
      console.error(error);
      req.flash("error", error.message);
      return res.redirect("/folder");
    }

    await fileDB.deleteFileById(req.locals.file.id);
    req.flash("success", "File delete successfuly");
    res.redirect(`/folder/${req.locals.file.folderId || ""}`);
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
      const file = parent.files.find((f) => f.name === value);
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
    const newPath = `${req.user.id}/${req.locals.file.folderId}/${newName}`;
    const newUrl = `${process.env.SUPABASEURL}/storage/v1/object/public/uploads/${newPath}`;

    const { data, error } = await supabase.storage
      .from("uploads")
      .move(req.locals.file.path, newPath);

    if (error) {
      console.error(error);
      req.flash("error", error.message);
      return res.redirect(`/folder`);
    }

    const file = await fileDB.renameFileById(fileId, newName, newPath, newUrl);

    if (file.name === newName) {
      req.flash("success", "File renamed successfuly!");
      res.redirect(`/folder/${req.locals.file.folderId || ""}`);
    } else {
      req.flash("error", "Error renaming file!");
      res.redirect("/folder");
    }
  },
];

module.exports = {
  fileGet,
  fileDeleteGet,
  fileRenamePost,
};
