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

async function getFolderContent(folderId, userId) {
  if (!folderId) {
    return await getRootContent(userId);
  }

  const folder = await prisma.folder.findUnique({
    where: {
      id: folderId,
    },
    include: {
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

  if (!folder) {
    return null;
  }

  return {
    name: folder.name,
    userId: folder.userId,
    files: folder.files,
    children: folder.children,
    id: folder.id,
  };
}

async function getFilesRecursive(folderId) {
  const queue = [folderId];
  const files = [];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const folder = await getFolderContent(currentId);
    folder.files.forEach((file) => files.push(file));
    folder.children.forEach((subfolder) => queue.push(subfolder.id));
  }

  return files;
}

async function getRootContent(userId) {
  const children = await prisma.folder.findMany({
    where: {
      userId: userId,
      parentId: null,
    },
  });

  const files = await prisma.file.findMany({
    where: {
      userId: userId,
      folderId: null,
    },
  });

  return { name: "/", userId, children, files, id: "" };
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

async function renameFolderById(id, newName) {
  const folder = await prisma.folder.update({
    where: {
      id: id,
    },
    data: {
      name: newName,
    },
  });

  return folder;
}

async function deleteFolderById(id) {
  const folder = await prisma.folder.delete({
    where: {
      id: id,
    },
    include: {
      files: true,
    },
  });

  return folder;
}

module.exports = {
  createFolder,
  getFolderContent,
  getFolderPath,
  renameFolderById,
  deleteFolderById,
  getFilesRecursive,
};
