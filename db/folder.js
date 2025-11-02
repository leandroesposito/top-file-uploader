const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

async function createFolder(name, parentId, userId) {
  const newFolder = prisma.folder.create({
    data: {
      name: name,
      parentId: parentId || null,
      userId: userId,
    },
  });

  return newFolder;
}

async function getFolderContent(folderId) {
  const folder = await prisma.folder.findUnique({
    where: {
      parentId: folderId,
    },
    include: {
      name: true,
      files: {
        orderBy: {
          filename: "asc",
        },
      },
      children: {
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  return { name: folder.name, files: folder.files, children: folder.children };
}

async function getFolderPath(folderId) {
  const path = [];
  let currentId = folderId;

  while (currentId) {
    const folder = await prisma.folder.findUnique({
      where: {
        id: currentId,
      },
      select: {
        id: true,
        name: true,
        parentId: true,
      },
    });

    if (!folder) {
      break;
    }

    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return path;
}

module.exports = {
  createFolder,
  getFolderContent,
  getFolderPath,
};
