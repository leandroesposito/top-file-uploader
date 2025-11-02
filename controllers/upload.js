const authValidator = require("./auth-validator");
const validator = require("./validator");
const { folderValidator } = require("./folder");
const { param } = require("express-validator");
const multer = require("multer");
const upload = multer({
  dest: "./uploads/",
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
}).single("file");
const fileDB = require("../db/file");

const uploadGet = [
  authValidator.isAuthenticated,
  function uploadGet(req, res) {
    res.render("upload.ejs", { title: "Upload" });
  },
];

const uploadPost = [
  authValidator.isAuthenticated,
  param("folderId").custom(folderValidator.folderExist),
  folderValidator.folderBelongsToUser,
  validator.checkValidation,
  async function (req, res) {
    if (res.errors) {
      return res.redirect("/folder");
    }
    res.locals.folder = req.locals.folder;
    upload(req, res, async function (error) {
      if (!req.file) {
        req.flash("error", "You must select a file to upload");
        return res.redirect(`/folder/${res.locals.folder.id}`);
      }

      if (error) {
        if (error instanceof multer.MulterError) {
          req.flash("error", error.message + " max file size is 5 MB");
          return res.redirect("/folder");
        } else {
          throw error;
        }
      }

      const file = {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        folderId: res.locals.folder.id || null,
      };

      const newFile = await fileDB.createFile(file, req.user.id);

      if (newFile) {
        req.flash("success", "File uploaded succesfuly");
        res.redirect("/upload");
      } else {
        req.flash("error", "Error uploading file");
        res.redirect("/upload");
      }
    });
  },
];

module.exports = {
  uploadGet,
  uploadPost,
};
