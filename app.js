require("./config/db");
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const path = require("path");
const userModel = require("./models/user");
const postModel = require("./models/post");
const user = require("./models/user");


app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.use(cookieParser());

app.get("/",function(req,res){
    // res.send("Hello...");
    res.render("index");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.post("/login",async function(req,res){
    let {email,password} = req.body;
    let user = await userModel.findOne({email});
    if(!user) return res.status(400).send("User not found!");

    bcrypt.compare(password,user.password,function(err,result){
        if(result) {
            let token = jwt.sign({email:email,_id:user._id},"shhhh");
            res.cookie("token",token,{httpOnly:true});
            res.status(200).redirect("/profile");
        }
        else res.redirect("/login");
    });

});

app.post("/register",async (req,res) => {
    let {email,password,username,name,age} = req.body;
    const existingUser = await userModel.findOne({ email });
    if(existingUser){
        return res.status(400).send("Userr already exists!");
    }
    
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password,salt);

    const user = await userModel.create({
        name,
        username,
        age,
        email,
        password:hash
    });

    const token = jwt.sign({userid:user._id},"shhhh");

    res.cookie("token",token,{httpOnly:true});

    // test
    const testUser = await userModel.findById(user._id);
    console.log("User saved check:", testUser);

    res.redirect("/profile");
});



app.get("/logout",function(req,res){
    res.clearCookie("token");
    res.redirect("/login");
});

// protected route
app.get("/profile",isLoggedIn,async (req,res) => {
    // console.log(req.user);
    console.log("JWT payload:", req.user);
    let user = await userModel.findById(req.user._id).populate("posts");
    if (!user) {
        console.log("User not found for id:", req.user._id);
        res.clearCookie("token");
        return res.redirect("/login");
    }
    // user;
    // console.log(user);
    console.log("User from DB:", user);

    res.render("profile",{ user });

});

app.post("/post",isLoggedIn, async (req,res) => {
    // let user = await userModel.findOne({email:req.user.email});
    // let {content} = req.body;
    const user = await userModel.findById(req.user._id);
    if (!user) return res.status(404).send("User not found");
    
    

    const post = await postModel.create({
        user:user._id,
        content:req.body.content
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
   
});

app.get("/like/:_id",isLoggedIn,async(req,res) => {
    let post = await postModel.findOne({_id:req.params._id}).populate("user");

    console.log("posts ki value",post);
    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.idexof(req.user.userid),1);
    }

    await post.save();
    res.redirect("/profile");
});

app.get("/edit/:id", isLoggedIn ,async (req,res) => {
    let post = await postModel.findOne({_id:req.params.id}).populate("user");

    res.render("edit",{post});
});

app.post("/update/:id",isLoggedIn,async (req,res) => {
    let post = await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.content});
    // await post.save();
    res.redirect("/profile");
});
// ek middleware chahiye  protected routes k liye
// issi ko hum kehte hai protected routes
function isLoggedIn(req,res,next){
    if(req.cookies.token===""){
        // res.send("You must be logged in..!");
        return res.redirect("/login");
    }else{
        let data = jwt.verify(req.cookies.token,"shhhh");
        req.user = data;
        console.log(data);
    }
    next();
}


app.listen(3000);