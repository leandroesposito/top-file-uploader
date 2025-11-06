const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

async function createFile(file, userId) {
  const newFile = await prisma.file.create({
    data: {
      name: file.name,
      size: file.size,
      userId: userId,
      folderId: file.folderId,
      url: file.url,
      path: file.path,
    },
  });

  return newFile;
}

async function getFileById(id) {
  const file = await prisma.file.findUnique({
    where: {
      id: id,
    },
  });

  return file;
}

async function deleteFileById(id) {
  await prisma.file.delete({
    where: {
      id: id,
    },
  });
}

async function renameFileById(id, newName, newPath, newUrl) {
  const file = await prisma.file.update({
    where: {
      id: id,
    },
    data: {
      name: newName,
      path: newPath,
      url: newUrl,
    },
  });

  return file;
}

module.exports = {
  createFile,
  getFileById,
  deleteFileById,
  renameFileById,
};
