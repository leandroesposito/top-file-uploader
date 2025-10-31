const multer = require("multer");
const upload = multer({
  dest: "./uploads/",
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
}).single("file");
const fileDB = require("../db/file");

function uploadGet(req, res) {
  res.render("upload.ejs", { title: "Upload" });
}

const uploadPost = [
  ,
  async function (req, res) {
    upload(req, res, async function (error) {
      if (error) {
        if (error instanceof multer.MulterError) {
          req.flash("error", error.message + " max file size is 5 MB");
          return res.redirect("/upload");
        } else {
          throw error;
        }
      }

      console.dir(req.file, { colors: true });

      const file = {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
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
