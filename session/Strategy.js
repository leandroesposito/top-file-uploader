const { PrismaClient } = require("../generated/prisma");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const Strategy = new LocalStrategy(async (username, password, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!user) {
      done(null, false, { message: "Incorrect username or password" });
    }

    if (!bcrypt.compare(password, user.password)) {
      done(null, false, { message: "Incorrect username or password" });
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = Strategy;
