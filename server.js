const http = require("http");
const fs = require("fs");
const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
const app = express();
const bodyParser = require("body-parser");
const server = http.createServer(app);
const path = require("path");

const cookieParser = require("cookie-parser");
const axios = require("axios");

const { MessageEmbed, WebhookClient } = require("discord.js");
const kurnazBot = new WebhookClient({
  id: process.env.webhookID,
  token: process.env.webhookToken,
});

app.use(cookieParser());
const port = 8080;

//Socket
const { Server } = require("socket.io");
const io = new Server(server);

io.on("connection", (socket) => {
  console.log("Kullanıcı Giriş yaptı");
  socket.on("gonder", (data) => {
    console.log(
      `${data.username} Adlı Kullanıcı Gönderi Paylaştı (${data.id})`
    );
    socket.emit("gonder");
  });
});
//Generate token
function generate_token(length) {
  var a =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890_".split("");
  var b = [];
  for (var i = 0; i < length; i++) {
    var j = (Math.random() * (a.length - 1)).toFixed(0);
    b[i] = a[j];
  }
  return b.join("");
}
//Upload file
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/data");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + ".png");
  },
});
const upload = multer({ storage: storage });
app.post("/stats", upload.single("uploaded_file"), function (req, res) {
  console.log(req.file, req.body);
});
//Body Parser
app.use(bodyParser.json()).use(
  bodyParser.urlencoded({
    extended: true,
  })
);
//Statik
app.use(express.static("public"));
app.set("src", "path/to/views");
app.use("/uploads", express.static("public/data"));
//MongoDB
const dbURL = process.env.db;
mongoose
  .connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((result) => {
    server.listen(port, () => {
      console.log("mongoDB Bağlantı kuruldu");
    });
  })
  .catch((err) => console.log(err));
//Collections
const Users = require("./models/users.js");
const Photos = require("./models/photos.js");
const About = require("./models/pageAbout.js");
//viewPort
app.set("view engine", "ejs");
//DB Support
app.use(morgan("dev"));
//Pages
//Home
app.get("/", (req, res) => {
  let userId = req.cookies.id;
  let token = req.cookies.token;

  Photos.find()
    .sort({ createdAt: -1 })
    .then((photoResult) => {
      Users.find({ ekip: "true" }).then((ekipResult) => {
        Users.find({ artist: "true" }).then((artistResult) => {
          About.find().then((aboutResult) => {
            if (token != null) {
              Users.findOne({ token: token }).then((userResult) => {
                res.render(`${__dirname}/src/user/index.ejs`, {
                  user: userResult,
                  title: "Anasayfa",
                  photo: photoResult,
                  about: aboutResult,
                  ekip: ekipResult,
                  artist: artistResult,
                });
              });
            } else {
              res.render(`${__dirname}/src/pages/index.ejs`, {
                title: "Anasayfa",
                photo: photoResult,
                about: aboutResult,
                ekip: ekipResult,
                artist: artistResult,
              });
            }
          });
        });
      });
    });
});
//Admin home
app.get("/admin/home", (req, res) => {
  let userId = req.cookies.id;
  let token = req.cookies.token;

  Users.findOne({ token: token }).then((userResult) => {
    Photos.find()
      .sort({ createdAt: -1 })
      .then((photosResult) => {
        About.find()
          .sort()
          .then((aboutResult) => {
            Users.find({ ekip: "true" })
              .sort()
              .then((ekipResult) => {
                Users.find({ artist: "true" })
                  .sort()
                  .then((artistResult) => {
                    res.render(`${__dirname}/src/admin/index.ejs`, {
                      title: "Anasayfa",
                      user: userResult,
                      photo: photosResult,
                      about: aboutResult,
                      ekip: ekipResult,
                      artist: artistResult,
                    });
                  });
              });
          });
      });
  });
});
//Ekip home
app.get("/ekip/home", (req, res) => {
  let userId = req.cookies.id;
  let token = req.cookies.token;

  Users.findOne({ token: token }).then((userResult) => {
    Users.find({ ekip: "true" }).then((ekipResult) => {
      Users.find({ artist: "true" }).then((artistResult) => {
        About.find()
          .sort()
          .then((aboutResult) => {
            Photos.find()
              .sort({ createdAt: -1 })
              .then((photosResult) => {
                res.render(`${__dirname}/src/ekip/index.ejs`, {
                  title: "Anasayfa",
                  user: userResult,
                  photo: photosResult,
                  about: aboutResult,
                  ekip: ekipResult,
                  artist: artistResult,
                });
              });
          });
      });
    });
  });
});
//Artist home
app.get("/artist/home", (req, res) => {
  let userId = req.cookies.id;
  let token = req.cookies.token;

  Users.findOne({ token: token }).then((userResult) => {
    Users.find({ ekip: "true" }).then((ekipResult) => {
      Users.find({ artist: "true" }).then((artistResult) => {
        Photos.find()
          .sort({ createdAt: -1 })
          .then((photosResult) => {
            About.find().then((aboutResult) => {
              res.render(`${__dirname}/src/artist/index.ejs`, {
                title: "Anasayfa",
                user: userResult,
                ekip: ekipResult,
                artist: artistResult,
                photo: photosResult,
                about: aboutResult,
              });
            });
          });
      });
    });
  });
});
//Login - Register Pages
//Login
app.get("/login", (req, res) => {
  let UserId = req.cookies.id;
  if (UserId != null) {
    res.redirect("/");
  } else {
    res.render(`${__dirname}/src/pages/login.ejs`, { title: "Giriş yap" });
  }
});
//Register
app.get("/register", (req, res) => {
  let UserId = req.cookies.id;
  if (UserId != null) {
    res.redirect("/");
  } else {
    res.render(`${__dirname}/src/pages/register.ejs`, { title: "Kayıt ol" });
  }
});
//Profile pages
app.get("/profile/:url", (req, res) => {
  let url = req.params.url;
  let userId = req.cookies.id;
  let token = req.cookies.token;
  Users.findOne({ url: url }).then((userResult) => {
    Photos.find({ userId: userResult._id }).then((photoResult) => {
      if (token != null) {
        Users.findOne({ token: token })
          .then((realUserResult) => {
            res.render(`${__dirname}/src/user/profile.ejs`, {
              title: `${userResult.username}`,
              users: userResult,
              photo: photoResult,
              user: realUserResult,
            });
          })
          .catch((err) => {
            res.send(`Böyle bir kullanıcı yok`);
          });
      } else {
        res.render(`${__dirname}/src/pages/profile.ejs`, {
          title: userResult.username,
          users: userResult,
          photo: photoResult,
        });
      }
    });
  });
});
//Ekip Profile
app.get("/ekip/profile/:url", (req, res) => {
  let url = req.params.url;
  let userId = req.cookies.id;
  let token = req.cookies.token;

  Users.findOne({ url: url }).then((userResult) => {
    Photos.find({ userId: userResult._id }).then((photoResult) => {
      Users.findOne({ token: token }).then((ekipResult) => {
        res.render(`${__dirname}/src/ekip/profile.ejs`, {
          title: userResult.username,
          users: userResult,
          user: ekipResult,
          photo: photoResult,
        });
      });
    });
  });
});
//Artist Profile
app.get("/artist/profile/:url", (req, res) => {
  let url = req.params.url;
  let userId = req.cookies.id;
  let token = req.cookies.token;

  Users.findOne({ url: url }).then((userResult) => {
    Photos.find({ userId: userResult._id }).then((photoResult) => {
      Users.findOne({ token: token }).then((artistResult) => {
        res.render(`${__dirname}/src/artist/profile.ejs`, {
          title: userResult.username,
          users: userResult,
          user: artistResult,
          photo: photoResult,
        });
      });
    });
  });
});
//Admin Profile
app.get("/admin/profile/:url", (req, res) => {
  let url = req.params.url;
  let userId = req.cookies.id;
  let token = req.cookies.token;

  Users.findOne({ url: url }).then((userResult) => {
    Photos.find({ userId: userResult._id }).then((photoResult) => {
      Users.findOne({ token: token }).then((adminResult) => {
        res.render(`${__dirname}/src/admin/profile.ejs`, {
          title: userResult.username,
          users: userResult,
          user: adminResult,
          photo: photoResult,
        });
      });
    });
  });
});
//Dashboards
//Admin
app.get("/admin/dashboard/:id", (req, res) => {
  let id = req.params.id;
  let userId = req.cookies.id;
  let token = req.cookies.token;

  Users.findOne({ token: token }).then((userResult) => {
    if (userResult._id != id) {
      res.redirect("/");
    } else {
      Users.find()
        .sort()
        .then((usersResult) => {
          Photos.find()
            .sort({ createdAt: -1 })
            .then((photosResult) => {
              About.find()
                .sort()
                .then((aboutResult) => {
                  res.render(`${__dirname}/src/admin/dashboard.ejs`, {
                    title: "Admin Dashboard",
                    user: userResult,
                    users: usersResult,
                    photos: photosResult,
                    about: aboutResult,
                  });
                });
            });
        });
    }
  });
});
//Ekip
app.get("/ekip/dashboard/:id", (req, res) => {
  let id = req.params.id;
  let userId = req.cookies.id;
  let token = req.cookies.token;

  Users.findOne({ token: token }).then((userResult) => {
    if (userResult._id != id) {
      res.redirect("/");
    } else {
      Photos.find({ userId: userId })
        .sort({ createdAt: -1 })
        .then((photosResult) => {
          res.render(`${__dirname}/src/ekip/dashboard.ejs`, {
            title: "Ekip Dashboard",
            user: userResult,
            photos: photosResult,
          });
        });
    }
  });
});
//Methods
//Login
app.post("/login", (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  Users.findOne({ username: username, password: password }).then(
    (userResult) => {
      res.cookie("id", userResult._id);
      res.cookie("token", userResult.token);
      res.redirect("/");
    }
  );
});
//Register
app.post("/register", (req, res) => {
  let username = req.body.username;
  Users.findOne({ username: username }, (user, err) => {
    if (user) {
      res.send("Böyle bir kullanıcı var");
    } else {
      let newUser = new Users({
        username: username,
        password: req.body.password,
        email: req.body.email,
        bagdes: "User",
        ekip: "false",
        admin: "false",
        artist: "false",
        photo:
          "https://cdn.glitch.global/e40803d6-689d-4f0f-be66-debb139801d0/94df1411-5121-436c-ad1f-8e7a8ae99a1d.image.png?v=1659570675147",
        badges: [],
        token: generate_token(36),
      });
      newUser.save().then((Result) => {
        res.cookie("id", Result._id);
        res.cookie("token", Result.token);
        res.redirect("/");
      });
    }
  });
});
//Sign out
app.get('/sign-out', (req,res)=>{
  res.clearCookie("id");
  res.clearCookie("token");
  res.redirect('/');
})
//ADD Photo
//Admin
app.post("/admin/add/photo/:id", upload.single("uploaded_file"), (req, res) => {
  let id = req.params.id;
  let admin = req.cookies.id;
  Users.findById(id).then((userResult) => {
    Users.findById(admin).then((adminResult) => {
      if (adminResult.admin == "true") {
        let photo = new Photos({
          title: req.body.title,
          description: req.body.description,
          photo: `/uploads/${req.file.filename}`,
          userId: id,
          user: userResult.username,
        });
        photo.save().then((photoResult) => {
          res.redirect(`/admin/dashboard/${id}`);
          const embed = new MessageEmbed()
            .setTitle("Yeni fotoğraf eklendi")
            .addFields(
              {
                name: "Fotoğrafı ekleyen kullanıcı",
                value: photoResult.user,
                inline: true,
              },
              { name: "ID", value: id, inline: true },
              { name: "\u200B", value: "\u200B" },
              { name: "Başlık", value: photoResult.title, inline: true },
              { name: "Açıklama", value: photoResult.description, inline: true }
            )
            .setImage(`https://caylaksanatcilar.tk/${photoResult.photo}`)
            .setTimestamp()
            .setColor("#3ae800");

          kurnazBot.send({
            username: "Siteye bir fotoğraf daha eklendi",
            avatarURL:
              "https://cdn.glitch.global/e40803d6-689d-4f0f-be66-debb139801d0/d99612fd-3de5-4148-b764-85b675900f46.image.png?v=1660237878798",
            embeds: [embed],
          });
        });
      } else {
        res.send("Güvenlik uyarısı");
      }
    });
  });
});
//Ekip
app.post("/ekip/add/photo/:id", upload.single("uploaded_file"), (req, res) => {
  let id = req.params.id;
  let ekip = req.cookies.id;

  Users.findById(id).then((userResult) => {
    let photo = new Photos({
      title: req.body.title,
      description: req.body.description,
      photo: `/uploads/${req.file.filename}`,
      userId: id,
      user: userResult.username,
    });
    photo.save().then((photoResult) => {
      res.redirect(`/ekip/dashboard/${id}`);
      const embed = new MessageEmbed()
        .setTitle("Yeni fotoğraf eklendi")
        .addFields(
          {
            name: "Fotoğrafı ekleyen kullanıcı",
            value: photoResult.user,
            inline: true,
          },
          { name: "ID", value: id, inline: true },
          { name: "\u200B", value: "\u200B" },
          { name: "Başlık", value: photoResult.title, inline: true },
          { name: "Açıklama", value: photoResult.description, inline: true }
        )
        .setImage(`https://caylaksanatcilar.tk/${photoResult.photo}`)
        .setTimestamp()
        .setColor("#3ae800");

      kurnazBot.send({
        username: "Siteye bir fotoğraf daha eklendi",
        avatarURL:
          "https://cdn.glitch.global/bf92fde5-d20f-4b3a-9e8c-b67443b07743/008f0bd4-8714-4cce-b354-51321651faa7.image.png?v=1656729003771",
        embeds: [embed],
      });
    });
  });
});
//Artist
app.post(
  "/artist/add/photo/:id",
  upload.single("uploaded_file"),
  (req, res) => {
    let id = req.params.id;
    let artist = req.cookies.id;

    Users.findById(id).then((userResult) => {
      Users.findById(artist).then((artistResult) => {
        if (artistResult.artist == "true") {
          let photo = new Photos({
            title: req.body.title,
            description: req.body.description,
            photo: `/uploads/${req.file.filename}`,
            userId: id,
            user: userResult.username,
          });
          photo.save().then((photoResult) => {
            res.redirect(`/artist/dashboard/${id}`);
            const embed = new MessageEmbed()
              .setTitle("Yeni fotoğraf eklendi")
              .addFields(
                {
                  name: "Fotoğrafı ekleyen kullanıcı",
                  value: photoResult.user,
                  inline: true,
                },
                { name: "ID", value: id, inline: true },
                { name: "\u200B", value: "\u200B" },
                { name: "Başlık", value: photoResult.title, inline: true },
                {
                  name: "Açıklama",
                  value: photoResult.description,
                  inline: true,
                }
              )
              .setImage(`https://caylaksanatcilar.tk/${photoResult.photo}`)
              .setTimestamp()
              .setColor("#3ae800");

            kurnazBot.send({
              username: "Siteye bir fotoğraf daha eklendi",
              avatarURL:
                "https://cdn.glitch.global/bf92fde5-d20f-4b3a-9e8c-b67443b07743/008f0bd4-8714-4cce-b354-51321651faa7.image.png?v=1656729003771",
              embeds: [embed],
            });
          });
        } else {
          res.send("Güvenlik uyarısı");
        }
      });
    });
  }
);
//Remove Photo
//Admin
app.post("/admin/remove/photo/:id", (req, res) => {
  let userId = req.cookies.id;
  let id = req.params.id;

  Users.findById(userId).then((userResult) => {
    Photos.findByIdAndDelete(id).then((result) => {
      res.redirect(`/admin/dashboard/${userId}`);
      const embed = new MessageEmbed()
        .setTitle("Fotoğraf silindi")
        .setDescription("Silinen fotoğraf:")
        .setImage(`https://caylaksanatcilar.tk/${result.photo}`)
        .setFooter(`Silen Kullanıcı ${userResult.username}`)
        .setTimestamp()
        .setColor("#ff0000");

      kurnazBot.send({
        username: "Siteye bir fotoğraf daha eklendi",
        avatarURL:
          "https://cdn.glitch.global/bf92fde5-d20f-4b3a-9e8c-b67443b07743/008f0bd4-8714-4cce-b354-51321651faa7.image.png?v=1656729003771",
        embeds: [embed],
      });
    });
  });
});
//Ekip
app.post("/ekip/remove/photo/:id", (req, res) => {
  let userId = req.cookies.id;
  let id = req.params.id;
  Users.findById(userId).then((userResult) => {
    Users.findById(userId).then((ekipResult) => {
      if (ekipResult.ekip == "true") {
        Photos.findByIdAndDelete(id).then((result) => {
          res.redirect(`/ekip/dashboard/${userId}`);
          const embed = new MessageEmbed()
            .setTitle("Fotoğraf silindi")
            .setDescription("Silinen fotoğraf:")
            .setImage(`https://caylaksanatcilar.tk/${result.photo}`)
            .setFooter(`Silen Kullanıcı ${userResult.username}`)
            .setTimestamp()
            .setColor("#ff0000");

          kurnazBot.send({
            username: "Siteye bir fotoğraf daha eklendi",
            avatarURL:
              "https://cdn.glitch.global/bf92fde5-d20f-4b3a-9e8c-b67443b07743/008f0bd4-8714-4cce-b354-51321651faa7.image.png?v=1656729003771",
            embeds: [embed],
          });
        });
      } else {
        res.send("Güvenlik uyarısı");
      }
    });
  });
});
//Artist
app.post("/artist/remove/photo/:id", (req, res) => {
  let userId = req.cookies.id;
  let id = req.params.id;

  Users.findById(userId).then((userResult) => {
    Users.findById(userId).then((artistResult) => {
      if (artistResult.artist == "true") {
        Photos.findByIdAndDelete(id).then((result) => {
          res.redirect(`/artist/dashboard/${userId}`);
          const embed = new MessageEmbed()
            .setTitle("Fotoğraf silindi")
            .setDescription("Silinen fotoğraf:")
            .setImage(`https://caylaksanatcilar.tk/${result.photo}`)
            .setFooter(`Silen Kullanıcı ${userResult.username}`)
            .setTimestamp()
            .setColor("#ff0000");

          kurnazBot.send({
            username: "Siteye bir fotoğraf daha eklendi",
            avatarURL:
              "https://cdn.glitch.global/bf92fde5-d20f-4b3a-9e8c-b67443b07743/008f0bd4-8714-4cce-b354-51321651faa7.image.png?v=1656729003771",
            embeds: [embed],
          });
        });
      } else {
        res.send("GÜVENLIK UYARISI");
      }
    });
  });
});
//Admin Side
//Add Bagde - Page
app.get("/admin/add/badge/:id", (req, res) => {
  let id = req.params.id;
  let userId = req.cookies.id;
  Users.findById(id).then((userResult) => {
    Users.findById(userId).then((adminResult) => {
      if (adminResult.admin == "true") {
        res.render(`${__dirname}/src/admin/add-badge.ejs`, {
          title: `${userResult.username}'i Ödüllendir!`,
          users: userResult,
          user: adminResult,
        });
      } else {
        res.send("Güvenlik uyarısı");
      }
    });
  });
});
//Add Badge - Form
app.post("/admin/add/user/badge/:id", (req, res) => {
  let id = req.params.id;
  let admin = req.cookies.id;
  Users.findById(admin).then((adminResult) => {
    if (adminResult.admin == "true") {
      Users.findByIdAndUpdate(id, {
        $push: { badges: req.body.badges },
      }).then((result) => {
        res.redirect(`/admin/dashboard/${admin}`);
      });
    } else {
      res.send("Güvenlik Uyarısı");
    }
  });
});
//Edit User
//Edit User - Page
app.get("/admin/edit/user/:id", (req, res) => {
  let id = req.params.id;
  let admin = req.cookies.id;
  Users.findById(id).then((userResult) => {
    Users.findById(admin).then((adminResult) => {
      if (adminResult.admin == "true") {
        res.render(`${__dirname}/src/admin/edit-user.ejs`, {
          title: `${userResult.username} Kullanıcısın bilgilerini Düzenle`,
          users: userResult,
          user: adminResult,
        });
      } else {
        res.send("GUVENLIK UYARISI");
      }
    });
  });
});
//Edit User - Form
app.post("/admin/edit/user/:id", (req, res) => {
  let id = req.params.id;
  let admin = req.cookies.id;

  Users.findById(admin).then((adminResult) => {
    if (adminResult.admin == "true") {
      Users.findByIdAndUpdate(id, {
        admin: req.body.admin,
        artist: req.body.artist,
        ekip: req.body.ekip,
        url: req.body.url,
      }).then((result) => {
        res.redirect(`/admin/dashboard/${adminResult._id}`);
      });
    } else {
      res.send("GUVENLIK UYARISI");
    }
  });
});
//Remove user

//Edit About Group
app.post("/admin/edit/about/:id", (req, res) => {
  let id = req.params.id;
  let admin = req.cookies.id;
  Users.findById(admin).then((adminResult) => {
    if (adminResult.admin == "true") {
      About.findByIdAndUpdate(id, {
        text: req.body.text,
      }).then((aboutResult) => {
        res.redirect(`/admin/dashboard/${admin}`);
      });
    } else {
      res.send("GÜVENLİK UYARISI");
    }
  });
});
//Edit Profile
//Admin
//Admin edit profile page
app.get("/admin/edit/myProfile/:token", (req, res) => {
  let id = req.params.token;
  let admin = req.cookies.token;
  Users.findOne({ token: admin })
    .sort({ createdAt: -1 })
    .then((adminResult) => {
      Photos.find({ userId: adminResult._id }).then((photoResult) => {
        res.render(`${__dirname}/src/admin/edit-profile.ejs`, {
          title: `${adminResult.username}`,
          user: adminResult,
          photo: photoResult,
        });
      });
    });
});
//Admin edit profile form
app.post(
  "/admin/edit/myProfile/:token",
  upload.single("uploaded_file"),
  (req, res) => {
    let token = req.params.token;
    Users.findOneAndUpdate(
      { token: token },
      {
        about: req.body.about,
        theme: req.body.theme,
        photo: `/uploads/${req.file.filename}`,
      }
    ).then((adminResult) => {
      res.redirect(`/admin/dashboard/${adminResult._id}`);
    });
  }
);
//Ekip member
//Ekip edit profile page
app.get("/ekip/edit/myProfile/:token", (req, res) => {
  let id = req.params.token;
  let ekip = req.cookies.token;
  Users.findOne({ token: ekip }).then((ekipResult) => {
    Photos.find({ userId: ekipResult._id }).then((photoResult) => {
      res.render(`${__dirname}/src/ekip/edit-profile.ejs`, {
        title: ekipResult.username,
        user: ekipResult,
        photo: photoResult,
      });
    });
  });
});
//Ekip edit profile form
app.post(
  "/ekip/edit/myProfile/:token",
  upload.single("uploaded_file"),
  (req, res) => {
    let token = req.params.token;
    Users.findOneAndUpdate(
      { token: token },
      {
        about: req.body.about,
        theme: req.body.theme,
        photo: `/uploads/${req.file.filename}`,
      }
    ).then((ekipResult) => {
      res.redirect(`/ekip/dashboard/${ekipResult._id}`);
    });
  }
);
//Artist
//Artist edit profile page
app.get("/artist/edit/myProfile/:token", (req, res) => {
  let token = req.params.token;
  let artist = req.cookies.token;

  Users.findOne({ token: artist }).then((artistResult) => {
    Photos.find({ userId: artist._id })
      .sort({ createdAt: -1 })
      .then((photoResult) => {
        res.render(`${__dirname}/src/artist/edit-profile.ejs`, {
          title: artistResult.username,
          user: artistResult,
          photo: photoResult,
        });
      });
  });
});
//Artist edit profile form
app.post(
  "/artist/edit/myProfile/:token",
  upload.single("uploaded_file"),
  (req, res) => {
    let token = req.params.token;
    Users.findOneAndUpdate(
      { token: token },
      {
        about: req.body.about,
        theme: req.body.theme,
        photo: `/uploads/${req.file.filename}`,
      }
    ).then((artistResult) => {
      res.redirect(`/artist/edit/myProfile/${artistResult.token}`);
    });
  }
);
//Settings
//Admin
//Admin Settings - page
app.get("/admin/settings/:token", (req, res) => {
  let token = req.params.token;
  let userToken = req.cookies.token;

  Users.findOne({ token: userToken }).then((userResult) => {
    if (userResult.admin != "true") {
      res.redirect("/");
    } else {
      res.render(`${__dirname}/src/admin/settings.ejs`, {
        title: userResult.username,
        user: userResult,
      });
    }
  });
});
//Admin Settings - form
app.post("/admin/settings/:token", (req, res) => {
  let token = req.params.token;
  let adminToken = req.cookies.token;
  if (token == adminToken) {
    Users.findOneAndUpdate(
      { token: token },
      {
        password: req.body.password,
        email: req.body.email,
        url: req.body.url,
      })
     .then((adminResult)=>{
      res.redirect('/')
    })
  } else {
    res.send("Güvenlik uyarısı [HTML FORM DENEMESİ]");
  }
});
//Ekip
//Ekip Settings - page
app.get('/ekip/settings/:token', (req,res)=>{
  let token = req.params.token;
  let userToken = req.cookies.token;
  
  if(token == userToken){
    Users.findOne({token : token})
    .then((userResult)=>{
      res.render(`${__dirname}/src/ekip/settings.ejs`,{
        title: userResult.username,
        user: userResult
      })
    })
  } else {
    res.redirect('/')
  }
})
//Ekip Settings - form
app.post("/ekip/settings/:token", (req, res) => {
  let token = req.params.token;
  let adminToken = req.cookies.token;
  if (token == adminToken) {
    Users.findOneAndUpdate(
      { token: token },
      {
        password: req.body.password,
        email: req.body.email,
        url: req.body.url,
      })
      .then((ekipResult)=>{
      res.redirect('/')
    })
  } else {
    res.send("Güvenlik uyarısı [HTML FORM DENEMESİ]");
  }
});
//Artist
//Artist settings - page
app.get('/artist/settings/:token', (req,res)=>{
  let token = req.params.token;
  let userToken = req.cookies.token;
  
  if(token == userToken){
    Users.findOne({token : token})
    .then((userResult)=>{
      res.render(`${__dirname}/src/artist/settings.ejs`,{
        title: userResult.username,
        user: userResult
      })
    })
  } else {
    res.redirect('/')
  }
})
//Artist settings - form
app.post("/artist/settings/:token", (req, res) => {
  let token = req.params.token;
  let adminToken = req.cookies.token;
  if (token == adminToken) {
    Users.findOneAndUpdate(
      { token: token },
      {
        password: req.body.password,
        email: req.body.email,
        url: req.body.url,
      })
      .then((artistResult)=>{
      res.redirect('/')
    })
  } else {
    res.send("Güvenlik uyarısı [HTML FORM DENEMESİ]");
  }
});
//User
//User settings - Page
app.get('/user/settings/:token', (req,res)=>{
  let token = req.params.token;
  let userToken = req.cookies.token;
  
  if(token == userToken){
    Users.findOne({token : token})
    .then((userResult)=>{
      res.render(`${__dirname}/src/user/settings.ejs`,{
        title: userResult.username,
        user: userResult
      })
    })
  } else {
    res.redirect('/')
  }
})
//User Settings - form
app.post("/user/settings/:token", (req, res) => {
  let token = req.params.token;
  let adminToken = req.cookies.token;
  if (token == adminToken) {
    Users.findOneAndUpdate(
      { token: token },
      {
        password: req.body.password,
        email: req.body.email,
        url: req.body.url,
      })
      .then((userResult)=>{
      res.redirect('/')
    })
  } else {
    res.send("Güvenlik uyarısı [HTML FORM DENEMESİ]");
  }
});
