const { param, body } = require("express-validator");
const folderDB = require("../db/folder");
const validator = require("./validator");
const authValidator = require("./auth-validator");
const fs = require("node:fs");
const path = require("node:path");

const folderValidator = {
  folderExist: async (value, { req }) => {
    const folder = await folderDB.getFolderContent(value, req.user.id);

    if (!folder) {
      throw new Error(`Folder with id ${value} doesn't exist!`);
    }

    req.locals = { folder };
    return true;
  },
  folderBelongsToUser: (req, res, next) => {
    if (req.locals?.folder && req.user.id != req.locals.folder.userId) {
      throw new Error("You don't have permission to access this folder!");
    }
    next();
  },
};

const folderGet = [
  param("id").custom(folderValidator.folderExist),
  authValidator.isAuthenticated,
  folderValidator.folderBelongsToUser,
  validator.checkValidation,
  async function folderGet(req, res) {
    if (res.locals.errors) {
      return res.redirect("/folder");
    }
    res.locals.folder = req.locals.folder;

    const path = await folderDB.getFolderPath(res.locals.folder.id);
    res.locals.path = path;

    res.render("folder.ejs", { title: res.locals.folder.name });
  },
];

const folderPost = [
  authValidator.isAuthenticated,
  body("parentId").custom(folderValidator.folderExist),
  folderValidator.folderBelongsToUser,
  body("name")
    .trim()
    .isLength({ min: 4, max: 100 })
    .withMessage("Folder name must be between 4 and 100 characters!")
    .custom((value, { req }) => {
      const folder = req.locals.folder.children.find(
        (child) => child.name === value
      );
      if (folder) {
        throw new Error("You already have a folder with that name!");
      }
      return true;
    }),
  validator.checkValidation,
  async function folderPost(req, res) {
    if (res.locals.errors) {
      return res.redirect("/folder");
    }

    const folder = {
      name: req.body.name,
      parentId: req.body.parentId,
    };

    const newFolder = await folderDB.createFolder(
      folder.name,
      folder.parentId,
      req.user.id
    );
    if (newFolder) {
      res.redirect(`/folder/${newFolder.id}`);
    } else {
      req.flash("error", "Error creating the folder!");
      res.redirect("/folder");
    }
  },
];

const folderRenamePost = [
  authValidator.isAuthenticated,
  param("id").custom(folderValidator.folderExist),
  body("newName")
    .trim()
    .isLength({ min: 4, max: 100 })
    .withMessage("Folder name must be between 4 and 100 characters!")
    .custom(async (value, { req }) => {
      const parent = await folderDB.getFolderContent(
        req.locals.folder.parentId
      );
      const folder = parent.children.find((child) => child.name === value);
      if (folder) {
        throw new Error("You already have a folder with that name!");
      }
      return true;
    }),
  folderValidator.folderBelongsToUser,
  validator.checkValidation,
  async function folderRenamePost(req, res) {
    if (res.locals.errors) {
      return res.redirect("/folder");
    }

    const folderId = req.locals.folder.id;
    const newName = req.body.newName;
    const folder = await folderDB.renameFolderById(folderId, newName);

    if (folder.name === newName) {
      req.flash("success", "Folder renamed successfuly!");
    } else {
      req.flash("error", "Error renaming folder!");
    }
    res.redirect("/folder");
  },
];

const folderDeleteGet = [
  authValidator.isAuthenticated,
  param("id", folderValidator.folderExist),
  folderValidator.folderBelongsToUser,
  validator.checkValidation,
  async function folderDeleteGet(req, res) {
    if (res.locals.errors) {
      return res.redirect("/folder");
    }

    const folderId = req.params.id;
    const files = await folderDB.getFilesRecursive(folderId);

    files.forEach((file) => {
      const filePath = path.join(__dirname, "../uploads", file.filename);
      fs.unlink(filePath, (error) => {
        if (error) {
          console.error(error);
          throw error;
        }
      });
    });

    const folder = await folderDB.deleteFolderById(folderId);
    if (folder) {
      req.flash("success", "Folder deleted succesfuly");
    } else {
      req.flash("error", "Error deleting folder");
    }
    res.redirect("/folder");
  },
];

module.exports = {
  folderGet,
  folderPost,
  folderValidator,
  folderRenamePost,
  folderDeleteGet,
};
