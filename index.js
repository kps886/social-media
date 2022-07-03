// requiring important modules
require("dotenv").config();
require("./db/db");
const express = require("express");
const bcrypt = require("bcrypt");
const app = express();
const port = process.env.PORT || 3000;
const path = require("path");
const hbs = require("hbs");
const crypto = require("crypto");
const User = require("./model/user");
const multer = require("multer");
const Post = require("./model/post");
const Comment = require("./model/comment");
const aPhotos = require("./model/albumPhotos");
const Album = require("./model/album");
const Like = require("./model/like");
const Book = require("./model/book");
const Follow = require("./model/follow");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const url = require("url");
const { auth, hauth } = require("./middleware/auth");
const mailer = (email, token) => {
  var nodemailer = require("nodemailer");
  var sender = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "princesheth88@gmail.com",
      pass: "zodgrzlrmdyytpuc",
    },
  });
  var mailopt = {
    from: "princesheth88@gmail.com",
    to: email,
    subject: "password reset link",
    html: `<p>Click on the <a href="http://localhost:3000/forgotpass/${token}&${email}">link</a> to reset your password</p>`,
  };
  sender.sendMail(mailopt, (err, info) => {
    if (err) {
      console.log(err);
    }
  });
};
const vmailer = (email) => {
  var nodemailer = require("nodemailer");
  var sender = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "princesheth88@gmail.com",
      pass: "zodgrzlrmdyytpuc",
    },
  });
  var mailopt = {
    from: "princesheth88@gmail.com",
    to: email,
    subject: "Email verification link",
    html: `<p>Click on the <a href="http://localhost:3000/verify/${email}">link</a> to reset your password</p>`,
  };
  sender.sendMail(mailopt, (err, info) => {
    if (err) {
      console.log(err);
    }
  });
};

//for reading post outputs and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/posts");
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
  },
});
const multerFilter = (req, file, cb) => {
  if (
    file.mimetype.split("/")[1] === "jpg" ||
    file.mimetype.split("/")[1] === "png" ||
    file.mimetype.split("/")[1] === "jpeg" ||
    file.mimetype.split("/")[1] === "svg+xml"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Not an image File!!"), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// setting specifications
app.set("view engine", "hbs");

// registering paths
const partial = path.join(__dirname, "./views/partials");
hbs.registerPartials(partial);

const public = path.join(__dirname, "./public");
app.use(express.static(public));

// renders for index page(login page)
app.get("/", (req, res) => {
  res.render("index");
});
app.post("/", async (req, res) => {
  try {
    let Email = req.body.email;
    let Password = req.body.pass;
    let result = await User.findOne({ Email });
    // console.log(result)
    let verify = await bcrypt.compare(Password, result.Password);
    const token = await jwt.sign({ _id: result._id }, process.env.Secret);
    result.jwtTokens = result.jwtTokens.concat({ token });
    let _id = result._id;
    result.save();
    res.cookie("jwt", token, {
      httpOnly: true,
    });
    if (verify) {
      res.cookie("id", _id, {
        httpOnly: true,
      });
      res.redirect("home");
    } else {
      res.status(309).render("index", {
        error: "wrong password",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(208).render("index", {
      error: err,
    });
  }
});

// renders for registration page
app.get("/register", (req, res) => {
  res.status(200).render("register");
});

app.post("/register", async (req, res) => {
  try {
    let Email = req.body.email_id;
    let name = req.body.name;
    let Password = req.body.pass;
    let cpass = req.body.cpass;
    if (cpass == Password) {
      Password = await bcrypt.hash(Password, 10);
      let user = new User({
        Email,
        name,
        Password,
      });
      await user.save();
      vmailer(Email);
      res.redirect("/");
    } else {
      res
        .status(400)
        .render("register", { error: "passwords are not matching" });
    }
  } catch (error) {
    res.status(400).render("register", { error: error });
  }
});
app.get("/verify/:email", async (req, res) => {
  let Email = req.params.email;
  let result = await User.findOne({ Email });
  result.verify = true;
  result.save();
  res.json({ result: "Your account is verified" });
});

// renders for forgot pass
app.get("/forgotpass", (req, res) => {
  res.status(200).render("fp");
});

app.get("/forgotpass/:resetToken", async (req, res) => {
  try {
    let resetToken = req.params.resetToken;
    let _id = req.cookies.id;

    let result = await User.find({ _id, resetToken });
    console.log(result);
    if (result != "") {
      res.redirect("/reset");
    } else {
      res.json("invalid link");
    }
  } catch (err) {
    res.json(err);
  }
});

app.post("/forgotpass", async (req, res) => {
  try {
    crypto.randomBytes(32, async (err, buf) => {
      if (err) {
        res.status(209).send(err);
      } else {
        let token = buf.toString("hex");
        let Email = req.body.email;
        let result = await User.findOne({ Email });
        if (result) {
          result.resetToken = token;
          result.expireToken = Date.now() + 3600000;
          await result.save();
          mailer(Email, token);
          res.status(200).render("fp", {
            text: "check your email for password reset link",
            style: "success",
          });
        } else {
          res.status(200).render("fp", {
            text: "Email not registered",
            style: "danger",
          });
        }
      }
    });
  } catch (error) {
    res.redirect("/register", { error: error });
  }
});

//delete account
app.get("/daccount", async (req, res) => {
  let _id = req.cookies.id;
  try {
    let result = await User.deleteOne({ _id });
    result = await Post.deleteMany({ postedBy: _id });
    result = await Comment.updateMany(
      { commentedBy: _id },
      { commentedBy: "Deleted User" }
    );
    console.log(result);
    res.redirect("/logout");
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//renders for album
app.get("/album", hauth, async (req, res) => {
  let result = await Album.find();
  let login = req.login;
  if (result == "") {
    res.render("albums", {
      albums: true,
      no_a: true,
      login,
    });
  } else {
    res.render("albums", {
      albums: true,
      data: result,
      login,
    });
  }
});
app.get("/createalbum", auth, async (req, res) => {
  res.render("createalbum");
});
app.post("/createalbum", async (req, res) => {
  let name = req.body.album;
  console.log(name);
  let result = new Album({ name });
  await result.save();
  res.redirect("/album");
});
app.get("/salbum/:id", hauth, async (req, res) => {
  let id = req.params.id;
  let login = req.login;
  let result = await aPhotos
    .find({ albumId: id })
    .populate("postedBy albumId", "name _id");
  if (result == "") {
    res.render("albums", {
      no_ph: true,
      photos: true,
      id,
      login,
    });
  } else {
    res.render("albums", {
      data: result,
      photos: true,
      login,
      id,
    });
  }
});
app.get("/addphoto/:id", async (req, res) => {
  let id = req.params.id;
  res.render("addphoto", {
    id,
  });
});
app.post("/addphoto", upload.single("img"), async (req, res) => {
  try {
    let _id = req.cookies.id;
    let user = await User.findOne({ _id });
    _id = req.body.id;
    let name = req.file.filename;
    let album = await Album.findOne({ _id });
    let photo = new aPhotos({
      name,
      albumId: album,
      postedBy: user,
    });
    await photo.save();
    res.redirect("/salbum/" + _id);
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});



//following
app.get("/following",async(req,res)=>{
    let following = []
    let follow = await Follow.find({followedBy:req.cookies.id},{followedTo:1,_id:0})
    follow.forEach((element) => {
        following.push(element.followedTo);
    });
    let users = await User.find(
        {$and:[{_id: { $ne: req.cookies.id }},{_id:{$in:following}}] },
        { name: 1, _id: 1 }
    );
    for (const key in users) {
        if (Object.hasOwnProperty.call(users, key)) {
            const element = users[key];
            var follows = await Follow.findOne({
                followedBy: req.cookies.id,
                followedTo: element._id,
            });
            if (follows == null) {
                follows = false;
            } else {
                follows = true;
            }
            }
    }
  res.render("users", { data: users, login: true,follows });
    
})




// renders for home
app.get("/home", hauth, async (req, res) => {
  try {
    let _id = req.cookies.id;
    let login = req.login;
    let posts;
    let follow;
    let follows = [];
    let like = [];
    let blocked = [];
    if (login) {
      let user = await User.findOne({ _id });
      if (user.blockedBy == "") {
        follow = await Follow.find(
          { followedBy: _id },
          { followedTo: 1, _id: 0 }
        );
        follow.forEach((element) => {
          follows.push(element.followedTo);
        });
        posts = await Post.find({ postedBy: { $in: follows } }).populate(
          "postedBy",
          "_id name"
        );
      } else {
        user.blockedBy.forEach((element) => {
          blocked.push(element.id);
        });
        // console.log(blocked)
        posts = await Post.find({$and:[{postedBy: { $nin: blocked } },{ postedBy: { $in: follows }}]}).populate(
          "postedBy",
          "_id name"
        );
      }
    } else {
      posts = await Post.find().populate("postedBy", "_id name");
    }
    if (posts == "") {
      res.redirect("/users");
      return;
    }
    for (const p in posts) {
      if (Object.hasOwnProperty.call(posts, p)) {
        const element = posts[p];
        element.like = await Like.find({ likedOn: element._id }).count();
        element.liked = await Like.findOne({
          likedOn: element._id,
          likedBy: _id,
        });
        element.booked = await Book.findOne({
          bookOn: element._id,
          bookBy: _id,
        });
        if (element.liked == null) {
          element.liked = false;
        } else {
          element.liked = true;
        }
        if (element.booked == null) {
          element.booked = false;
        } else {
          element.booked = true;
        }
      }
    }
    res.render("home", { data: posts, login, like });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//renders for myposts
app.get("/myp", auth, async (req, res) => {
  let _id = req.cookies.id;
  let login = req.login;
  let posts = await Post.find({ postedBy: _id }).populate(
    "postedBy",
    "_id name"
  );
  if (posts == "") {
    res.render("home", { no_p: true, my_p: true, login });
    return;
  }
  res.render("home", { data: posts, my_p: true, login });
});

// renders for reset
app.get("/reset", (req, res) => {
  res.render("reset");
});
app.post("/reset", async (req, res) => {
  if (req.body.pass == req.body.cpass) {
    let _id = req.cookies.id;
    let result = await User.findOne({ _id });
    result.Password = req.body.pass;
    result.Password = await bcrypt.hash(result.Password, 10);
    await result.save();
    res.redirect("/");
  } else {
    res.status(400).render("reset", {
      error: "enter same password",
    });
  }
});
app.get("/resetpass", async (req, res) => {
  res.render("resetpass");
});
app.post("/resetpass", async (req, res) => {
  let result = await User.findOne({ _id: req.cookies.id });
  // console.log(result)
  let verify = await bcrypt.compare(req.body.opass, result.Password);
  if (verify) {
    if (req.body.pass == req.body.cpass) {
      let Password = await bcrypt.hash(req.body.pass, 10);
      result.Password = Password;
      await result.save();
      res.redirect("/home");
    } else {
      res.render("resetpass", {
        error: "enter save password in both fields",
      });
    }
  } else {
    res.render("resetpass", {
      error: "incorrect old password",
    });
  }
});

// renders for post
app.get("/addp", auth, async (req, res) => {
  res.render("addpost");
});

app.post("/addp", upload.single("img"), async (req, res) => {
  try {
    let photo = req.file.filename;
    let caption = req.body.caption;
    let hash = req.body.hash;
    let user = await User.findOne({ _id: req.cookies.id });
    const post = new Post({
      photo,
      caption,
      hash,
      postedBy: user,
    });
    await post.save();
    res.redirect("/myp");
  } catch (err) {
    res.json(err);
  }
});
app.post("/dpost", async (req, res) => {
  let _id = req.body.id;
  try {
    let result = await Post.deleteOne({ _id });
    result = await Comment.deleteMany({ onPost: _id });
    res.redirect("/myp");
  } catch (err) {
    res.json(err);
  }
});

// for comment
app.post("/coment", async (req, res) => {
  try {
    let comment = req.body.coment;
    let _id = req.body.postid;
    let onPost = await Post.findOne({ _id });
    let commentedBy = req.cookies.id;
    let com = new Comment({
      comment: comment,
      commentedBy: commentedBy,
      onPost: onPost,
    });
    await com.save();
    res.redirect("/home");
  } catch (err) {
    res.json({ err: err });
  }
});
app.post("/scomment", async (req, res) => {
  let onPost = req.body.id;
  let comments = await Comment.find({ onPost }).populate("commentedBy", "name");
  if (comments == "") {
    res.render("comments", { no_c: true, login: true });
    return;
  }
  res.render("comments", { data: comments, login: true });
});
app.post("/dcomments", async (req, res) => {
  try {
    let _id = req.body.id;
    let result = await Comment.deleteOne({ _id });
    res.redirect("/myp");
  } catch (err) {
    res.json(err);
  }
});
app.get("/mycomments", auth, async (req, res) => {
  let login = req.login;
  let _id = req.cookies.id;
  try {
    let result = await Comment.find({ commentedBy: _id }).populate("commentedBy","name _id");
    if (result == "") {
      res.render("comments", { no_c: true, my_c: true, login });
      return;
    }
    res.render("comments", { data: result, my_c: true, login });
  } catch (err) {
    res.send(err);
  }
});

// renders for logout
app.get("/logout", auth, async (req, res) => {
  try {
    res.clearCookie("jwt");
    res.clearCookie("id");
    req.user.jwtTokens = req.user.jwtTokens.filter((ele) => {
      ele.token != req.token;
    });
    await req.user.save();
    res.redirect("/");
  } catch (err) {
    if (err == "") {
      res.json({ err: err });
    } else {
      res.redirect("/");
    }
  }
});

//block User
app.post("/buser", async (req, res) => {
  let _id = req.body.id;
  let id = req.cookies.id;
  let result = await User.findOne({ _id });
  result.blockedBy = result.blockedBy.concat({ id });
  result.save();
  res.redirect("/home");
});

app.get("/users", async (req, res) => {
    let following = []
    let follows = await Follow.find({followedBy:req.cookies.id},{_id:0,followedTo:1})
    follows.forEach((element) => {
        following.push(element.followedTo);
      });
    let users = await User.find(
        {$and:[{_id: { $ne: req.cookies.id }},{_id:{$nin:following}}] },
        { name: 1, _id: 1 }
    );
    for (const key in users) {
        if (Object.hasOwnProperty.call(users, key)) {
            const element = users[key];
            var follow = await Follow.findOne({
                followedBy: req.cookies.id,
                followedTo: element._id,
            });
                if (follow == null) {
                    element.follow = false;
                } else {
                    element.follow = true;
                }
            }
    }
  res.render("users", { data: users, login: true });
});

//search a hashtag
app.post("/search", hauth, async (req, res) => {
  let search = req.body.search;
  let value = req.body.action;
  try {
    if (search == "") {
      res.json({ error: "invalid Search" });
    } else {
      search = ".*" + search + "*.";
      let login = req.login;
      if (value == "Albums") {
        let result = await Album.find({ name: { $regex: search } });
        if (result == "") {
          res.render("albums", {
            albums: true,
            no_a: true,
            login,
          });
        } else {
          res.render("albums", {
            albums: true,
            data: result,
            login,
          });
        }
      } else if (value == "People") {
        let users = await User.find(
          { $and:[{_id: { $ne: req.cookies.id }},{name :{ $regex: search }}]},
          { name: 1, _id: 1 }
        );
        if(users == ""){
            res.render("users", { data: users, login: true,no_u:true });
        }
        else
        {
            for (const key in users) {
            if (Object.hasOwnProperty.call(users, key)) {
                const element = users[key];
                var follow = await Follow.findOne({
                followedBy: req.cookies.id,
                followedTo: element._id,
                });
                if (follow == null) {
                element.follow = false;
                } else {
                element.follow = true;
                }
            }
            }
            res.render("users", { data: users, login: true });}
      } else {
        let posts;
        let blocked = [];
        if (login) {
          let _id = req.cookies.id;
          let user = await User.findOne({ _id });
          if (user.blockedBy == "") {
            posts = await Post.find({ hash: { $regex: search } }).populate(
              "postedBy",
              "_id name"
            );
          } else {
            user.blockedBy.forEach((element) => {
              blocked.push(element.id);
            });
            posts = await Post.find({
              $and: [
                { postedBy: { $nin: blocked } },
                { hash: { $regex: search } },
              ],
            }).populate("postedBy", "_id name");
          }
        } else {
          posts = await Post.find({ hash: { $regex: search } }).populate(
            "postedBy",
            "_id name"
          );
        }
        if (posts == "") {
          res.render("search", { no_p: true, login });
          return;
        }
        res.render("search", { data: posts, login });
      }
    }
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});



//likes
app.get("/like/:id", async (req, res) => {
  let likedOn = req.params.id;
  let likedBy = req.cookies.id;
  let like = await Like.findOne({ likedBy, likedOn });
  if (like == null) {
    like = new Like({
      likedOn,
      likedBy,
    });
    await like.save();

    res.redirect("/home");
  } else {
    await Like.deleteOne({ likedBy, likedOn });
    res.redirect("/home");
  }
});



//bookmark
app.get("/book/:id", async (req, res) => {
  let bookOn = req.params.id;
  let bookBy = req.cookies.id;
  let book = await Book.findOne({ bookBy, bookOn });
  console.log(book);
  if (book == null) {
    book = new Book({
      bookOn,
      bookBy,
    });
    await book.save();

    res.redirect("/home");
  } else {
    await Book.deleteOne({ bookBy, bookOn });
    res.redirect("/home");
  }
});



//edit profile
app.get("/edit", async (req, res) => {
  let _id = req.cookies.id;
  let user = await User.findOne({ _id });
  res.render("edit", { user });
});
app.post("/edit", async (req, res) => {
  let _id = req.cookies.id;
  await User.updateOne({ _id }, { $set: { name: req.body.name } });
  let user = await User.findOne({ _id });
  res.redirect("/settings");
});



//settings
app.get("/settings", async (req, res) => {
  let id = req.cookies.id;
  let user = await User.findOne({ _id: id });
  let posts = await Post.find({ postedBy: id });
  let no_post = await Post.find({ postedBy: id }).count();
  let no_fol = await Follow.find({ followedTo: id }).count();
  let no_foling = await Follow.find({ followedBy: id }).count();
  res.render("setting", {
    user,
    posts,
    login: true,
    no_post,
    no_fol,
    no_foling
  });
});
app.get("/liked", async (req, res) => {
  try {
    let _id = req.cookies.id;
    let user = await User.findOne({ _id });
    let likes = await Like.find({ likedBy: _id }, { likedOn: 1, _id: 0 });
    let posts = [];
    for (const key in likes) {
      if (Object.hasOwnProperty.call(likes, key)) {
        const element = likes[key];
        let post = await Post.findOne({ _id: element.likedOn }).populate(
          "postedBy"
        );
        posts.push(post);
      }
    }
    if (posts == "") {
      res.render("setting", {
        no_l: true,
        login: true,
        user,
      });
    } else {
      res.render("setting", {
        no_l: false,
        login: true,
        data: posts,
        user,
      });
    }
  } catch (err) {
    console.log(err);
  }
});
app.get("/bookmarks", async (req, res) => {
  try {
    let _id = req.cookies.id;
    let user = await User.findOne({ _id });
    let books = await Book.find({ bookBy: _id }, { bookOn: 1, _id: 0 });
    let posts = [];
    for (const key in books) {
      if (Object.hasOwnProperty.call(books, key)) {
        const element = books[key];
        let post = await Post.findOne({ _id: element.bookOn }).populate(
          "postedBy"
        );
        posts.push(post);
      }
    }
    if (posts == "") {
      res.render("setting", {
        no_b: true,
        login: true,
        user,
      });
    } else {
      res.render("setting", {
        no_b: false,
        login: true,
        data: posts,
        user,
      });
    }
  } catch (err) {
    console.log(err);
  }
});




//follow
app.get("/follow/:id", async (req, res) => {
  let followedTo = req.params.id;
  let followedBy = req.cookies.id;
  let follow = await Follow.findOne({ followedBy, followedTo });
  if (follow == null) {
    follow = new Follow({
      followedBy,
      followedTo,
    });
    await follow.save();
    res.redirect("/users");
  } else {
    await Follow.deleteOne({ followedBy, followedTo });
    res.redirect("/users");
  }
});




// listening to the port
app.listen(port, () => {
  console.log(`listening to ${port}`);
});
