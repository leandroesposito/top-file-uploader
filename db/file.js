const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

async function createFile(file, userId) {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      files: {
        create: {
          originalname: file.originalname,
          filename: file.filename,
          size: file.size,
        },
      },
    },
  });
}

module.exports = {
  createFile,
};
