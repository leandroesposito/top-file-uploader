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
      return done(null, false, { message: "Incorrect username or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return done(null, false, { message: "Incorrect username or password" });
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = Strategy;
