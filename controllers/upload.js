const authValidator = require("./auth-validator");
const validator = require("./validator");
const { folderValidator } = require("./folder");
const { body } = require("express-validator");
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
  body("folderId").custom(folderValidator.folderExist),
  folderValidator.folderBelongsToUser,
  validator.checkValidation,
  async function (req, res) {
    if (res.errors) {
      return res.redirect("/folder");
    }
    upload(req, res, async function (error) {
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
        folderId: req.body.folderId || null,
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
