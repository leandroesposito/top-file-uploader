const { PrismaClient } = require("../generated/prisma");

const prisma = new PrismaClient();

async function createUser(user) {
  const newUser = await prisma.user.create({
    data: {
      username: user.username,
      password: user.password,
    },
  });

  return newUser;
}

async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  return user;
}

async function getUserByUsername(username) {
  const user = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });

  return user;
}

async function updateUser(user) {
  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      username: user.username,
      password: user.password,
    },
  });

  return updatedUser;
}

module.exports = {
  createUser,
  getUserById,
  getUserByUsername,
  updateUser,
};
