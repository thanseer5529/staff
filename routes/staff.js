const path = require("path");
const fs = require("fs");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

mongoose.connect("mongodb://localhost/stf");
db = mongoose.connection;
db.on("error", (err) => {
  console.log("connection lost", err);
});
db.once("open", () => {
  console.log("db connected to server");
});

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: [true, "name is required"],
    },
    email: {
      type: String,
      require: [true, "email is required"],
      unique: [true, "email already exist"],
    },
    address: {
      type: String,
      require: [true, "address is required"],
    },
    password: {
      type: String,
      require: [true, "password is required"],
    },
    mobile: {
      type: Number,
      require: [true, "phone number is required"],
    },
    user: {
      type: String,
      require: [true, "type of user is required"],
    },
    gender: {
      type: String,
      require: [true, "genderis required"],
    },
    dob: {
      type: String,
      require: [true, "dob  is required"],
    },
    path: String,
  },
  { collection: "staff", versionKey: false }
);

const usermodel = mongoose.model("user", schema);

function auth(req, res, next) {
  if (req.session.email) {
    next();
  } else res.redirect("/login");
}
const multer = require("multer");

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  },
});
let upload = multer({ storage: storage });
let single = upload.single("image");
router.get("/", (req, res) => {
  res.render("Users/signup");
});

router.post("/signup", async (req, res) => {
  single(req, res, (err) => {
    if (err) console.log(err, "upload error");
    else {
      console.log(req.file, "file");
      req.body.path = req.file.path;
      const content = req.body;
      const new_user = new usermodel(content);
      new_user
        .save()
        .then((data) => {
          console.log(data.email, "data");
          req.session["email"] = data.email;
          res.json({ err: false, msg: "user created" });
        })
        .catch((err) => {
          console.log("signup error while user saving ", err);
          res.json({ err: true, msg: err.message });
        });
    }
  });
});

router.get("/home", auth, (req, res) => {
  const who = req.session.email;
  usermodel
    .findOne({ email: who })
    .then((data) => {
      console.log(data, "data");
      if (data.user == "manager") res.render("Users/mng", { data });
      else if (data.user == "developer") res.render("Users/dev", { data });
      else res.send({ msg: "something went wrong" });
    })
    .catch((err) => {
      res.send({ err, msg: "something went wrong" });
    });
});

router.get("/login", (req, res) => {
  console.log("login");
  res.render("Users/login");
});

router.post("/login", async (req, res) => {
  const { password, email } = req.body;
  try {
    const user = await usermodel.findOne({ email, password });
    console.log(email, password, user);
    if (user) {
      req.session["email"] = user.email;
      res.json({ err: false, msg: "successfully logined " });
    } else {
      res.json({ err: true, msg: "wrong password or email " });
    }
  } catch (e) {
    res.json({ err: true, msg: "error occured while login" });
  }
});
module.exports = router;