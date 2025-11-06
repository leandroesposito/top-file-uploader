require("dotenv").config();
const authValidator = require("./auth-validator");
const validator = require("./validator");
const { folderValidator } = require("./folder");
const { param } = require("express-validator");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
}).single("file");
const fileDB = require("../db/file");
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.SUPABASEURL,
  process.env.SUPABASEAPIKEY
);

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

    upload(req, res, async function (err) {
      if (!req.file) {
        req.flash("error", "You must select a file to upload");
        return res.redirect(`/folder/${res.locals.folder.id}`);
      }

      if (err) {
        if (err instanceof multer.MulterError) {
          req.flash("err", err.message + " max file size is 5 MB");
          return res.redirect(`/folder/${res.locals.folder.id}`);
        } else {
          throw err;
        }
      }

      const filePath = `${res.locals.folder.userId}/${res.locals.folder.id}/${req.file.originalname}`;

      const file = {
        name: req.file.originalname,
        size: req.file.size,
        folderId: res.locals.folder.id || null,
        buffer: req.file.buffer,
      };

      if (res.locals.folder.files.find((f) => f.name === file.name)) {
        req.flash("error", "You already have a file with that name!");
        return res.redirect("/folder");
      }
      if (file.name.length < 4 || file.name.length > 100) {
        req.flash("error", "File name must be between 4 and 100 characters!");
        return res.redirect("/folder");
      }

      const { data, error } = await supabase.storage
        .from("uploads")
        .upload(filePath, file.buffer, {
          cacheControl: "3600",
          upsert: false,
        });

      file.path = data.path;
      file.url = `${process.env.SUPABASEURL}/storage/v1/object/public/uploads/${data.path}`;

      if (error) {
        console.error(error);
        req.flash("error", error.message);
        return res.redirect("/folder");
      }

      const newFile = await fileDB.createFile(file, req.user.id);

      if (newFile) {
        req.flash("success", "File uploaded succesfuly");
      } else {
        req.flash("error", "Error uploading file");
      }
      res.redirect(`/folder/${res.locals.folder.id}`);
    });
  },
];

module.exports = {
  uploadGet,
  uploadPost,
};
