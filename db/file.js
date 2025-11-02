const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

async function createFile(file, userId) {
  const newFile = await prisma.file.create({
    data: {
      originalname: file.originalname,
      filename: file.filename,
      size: file.size,
      userId: userId,
      folderId: file.folderId,
    },
  });

  return newFile;
}

module.exports = {
  createFile,
};
