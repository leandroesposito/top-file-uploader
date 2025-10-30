const userDB = require("../db/user");

async function serializeUser(user, done) {
  done(null, user.id);
}

async function deserializeUser(userId, done) {
  try {
    const user = await userDB.getUserById(userId);
    if (!user) {
      done(null, false);
    }

    done(null, user);
  } catch (error) {
    done(error);
  }
}

module.exports = {
  serializeUser,
  deserializeUser,
};
