//jshint esversion:6
// bcrypt
// require('dotenv').config();
// const express= require('express');
// const ejs= require('ejs');
// const bodyParser = require('body-parser');
// const mongoose = require('mongoose');
// const bcrypt= require("bcrypt");
// saltRounds=10;
// const app= express();

// app.use(express.static("public"));
// app.set('view engine','ejs');
// app.use(bodyParser.urlencoded({
//     extended:"true"
// }));


// mongoose.connect("mongodb://localhost:27017/userDB",{ useNewUrlParser:true });

// const userSchema = new mongoose.Schema({
//     email: String,
//     password: String
// });


// const User= new mongoose.model('User',userSchema);

// app.get('/',function(req,res){
//     res.render("home");
// });
// app.get('/login',function(req,res){
//     res.render("login");
// });
// app.get('/register',function(req,res){
//     res.render("register");
// });

// app.post('/register',function(req,res){

//     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//         const newuser= new User({
//             email: req.body.username,
//             password:hash
//         });
//         newuser.save(function(err){
//             if(err){
//                 console.log(err);
//             }
//             else{
//                 res.render("secrets");
//             }
//         });
//     });

   
// });

// app.post("/login",function(req,res){
//     const username= req.body.username;
//     const password= req.body.password;
//     User.findOne({email:username},function(err,founduser){
//         if(err)
//         {
//             console.log(err);
//         }
//         else{
//             if(founduser)
//             {
//                 bcrypt.compare(password,founduser.password, function(err, result) {
//                     if(result===true)
//                     {
//                         res.render("secrets");
//                     }
//                 });
//             }
//         }
//     });
// });

// app.listen(3000,function(){
//     console.log("server started at port 3000");
// });

require('dotenv').config();
const express= require('express');
const ejs= require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session= require("express-session");
const passport= require('passport');
const passportlocalmongoose= require('passport-local-mongoose');
const app= express();
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate= require("mongoose-findorcreate");

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://www.example.com/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, done) {
       User.findOrCreate({ googleId: profile.id }, function (err, user) {
         return done(err, user);
       });
  }
));

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
    extended:"true"
}));

app.use(session({
secret:"Alittlesecret",
resave:false,
saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB",{ useNewUrlParser:true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

userSchema.plugin(passportlocalmongoose);
userSchema.plugin(findOrCreate);

const User= new mongoose.model('User',userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/',function(req,res){
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google",{scope:["profile"]})
)

app.get("/auth/google/secrets",
passport.authenticate('google',{failureRedirect:"/login"}),
function(req,res){
    res.redirect("/secrets");
});

app.get('/login',function(req,res){
    res.render("login");
});
app.get('/register',function(req,res){
    res.render("register");
});
app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else
    {
        res.redirect("/login");
    }
})
app.get("/logout",function(req,res){
    req.logout();
    res.redirect("/");
})
app.post('/register',function(req,res){
  User.register({username: req.body.username},req.body.password, function(err,user){
      if(err)
      {
          console.log(err);
          res.redirect("/register");
      }
      else
      {
          passport.authenticate("local")(req,res,function(){
              res.redirect("/secrets");
          })
      }
  })
});

app.post("/login",function(req,res){
   
const user = new User({
    username: req.body.username,
    password:req.body.password
});

req.login(user,function(err){
    if(err){
        console.log(err);
    }
    else
    {
        passport.authenticate("local")(req,res,function(){
           res.redirect("/secrets");
        });
    }
})

});

app.listen(3000,function(){
    console.log("server started at port 3000");
});
