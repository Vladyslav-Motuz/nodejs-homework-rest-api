const express = require("express");
const createError = require("http-errors");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const Jimp = require("jimp");
const path = require("path");
const fs = require("fs/promises");

const authenticate = require("../../middlewares/authenticate");
const upload = require("../../middlewares/upload");

const { User, schemas } = require("../../models/user");

const router = express.Router();

const { SECRET_KEY } = process.env;

router.post("/signup", async (req, res, next) => {
  try {
    const { error } = schemas.signup.validate(req.body);
    if (error) {
      throw new createError(400, error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      throw new createError(409, "Email in use");
    }

    const salt = await bcryptjs.genSalt(10);
    const hashPassword = await bcryptjs.hash(password, salt);
    const avatarURL = gravatar.url(email);

    const result = await User.create({
      email,
      password: hashPassword,
      avatarURL,
    });

    res.status(201).json({
      user: {
        email,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { error } = schemas.signup.validate(req.body);
    if (error) {
      throw new createError(400, error.message);
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    const compareResult = await bcryptjs.compare(password, user.password);
    if (!user) {
      throw new createError(401, "Email or password is wrong");
    }
    if (!compareResult) {
      throw new createError(401, "Email or password is wrong");
    }
    const payload = {
      id: user._id,
    };

    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" });
    await User.findByIdAndUpdate(user._id, { token });
    res.status(201).json({
      token,
      user: {
        email,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/current", authenticate, async (req, res, next) => {
  res.json({
    email: req.user.email,
    subscription: req.user.subscription,
  });
});

router.get("/logout", authenticate, async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: null });
  res.status(204).send();
});

const avatarsDir = path.join(__dirname, "../../", "public", "avatars");

router.patch("/avatars", authenticate, upload.single("avatar"), async (req, res, next) => {
  const { path: tmpUpload, filename } = req.file;
  const { _id } = req.user;
  try {
    await Jimp.read(tmpUpload).then(avatar => {
      return avatar.resize(250, 250).write(tmpUpload);
    }).catch(error => console.log(error.message));

    const [extension] = filename.split(".").reverse();
    const newFileName = `${_id}.${extension}`;
    const resultUpload = path.join(avatarsDir, newFileName);
    await fs.rename(tmpUpload, resultUpload);

    const avatarURL = path.join("avatars", newFileName);
    await User.findByIdAndUpdate(_id, { avatarURL });
    res.json(`avatarURL: ${avatarURL}`);
  } catch (error) {    
    next(error);
  }
});

module.exports = router;
