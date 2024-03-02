//jshint esversion:6

import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();


const app = express();
const port = process.env.PORT;
const saltRounds = 10;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_CONNECT_URI);
var hrsTime = [];
var minsTime = [];
var hrsTotal = 0;
var minTotal = 0;

const todoSchema = new mongoose.Schema({
  name: String,
  type: String,
  hrs: Number,
  mins: Number,
  userEmail: {
    type: String,
    required: true,
  },
});

const Todo = mongoose.model("Todo", todoSchema);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

function calculateTime() {
  hrsTotal = hrsTime.reduce((partialSum, a) => partialSum + a, 0);
  minTotal = minsTime.reduce((partialSum, a) => partialSum + a, 0);
  hrsTotal += Math.floor(minTotal / 60);
  minTotal %= 60;
}
// const item1 = new Todo({
//   name: "Welcome to your todolist!",
//   type:"chore"
// });

// const item2 = new Todo({
//   name: "Hit the + button to add a new item.",
//   type:"chore"
// });

// const item3 = new Todo({
//   name: "<-- Hit this to delete an item.",
//   type:"chore"
// });

// const defaultItems = [item1, item2, item3];

// const listSchema = new mongoose.Schema({
//   name:String,
//   items: [todoSchema]
// });

//const List = mongoose.model("List",listSchema);
app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/list", async function (req, res) {
  try {
    //console.log(req.query.email);
    const currentUser = req.query.email;
    const result = await Todo.find({ userEmail: currentUser });
    //console.log(result);
    hrsTime = [];
    minsTime = [];
    result.forEach((todo) => hrsTime.push(todo.hrs));
    result.forEach((todo) => minsTime.push(todo.mins));
    calculateTime();
    res.render("list.ejs", {
      userEmailId: req.query.email,
      listTitle: "Today",
      newListItems: result,
      totalHrs: hrsTotal,
      totalMins: minTotal,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/logout", (req, res) => {
  res.redirect("/");
});

app.post("/list", async function (req, res) {
  const item = req.body;
  const listName = req.body.list;
  //console.log(listName);
  //console.log(item)
  //console.log("req.params = ", req.params);
  //console.log("req.body = ", req.body);
  const todo = new Todo({
    name: req.body.newItem,
    type: req.body.list,
    hrs: req.body.hours ? req.body.hours : 0,
    mins: req.body.mins ? req.body.mins : 0,
    userEmail: req.body.userEmail,
  });

  if (req.body.list === "Today") {
    todo.save();
    res.redirect(`/list?email=${req.body.userEmail}`);
  } else {
    const result = await List.findOne({ name: listName });
    result.items.push(todo);
    result.save();
    res.redirect("/" + listName);
  }
});
app.post("/register", async (req, res) => {
  const emailId = req.body.email;
  const password = req.body.password;
  // check if email already registered
  const result = await User.findOne({email:emailId});
  if (result) {
    console.log("Email already exists. Try logging in.");
    res.redirect("/login");
  } else {
    bcrypt.hash(password,saltRounds,async (err,hashPassword)=>{
      if(err){
        console.log("error while hashing",err)
      }else{
        const user = new User({
          email: emailId,
          password: hashPassword,
        });
        user.save();
        res.redirect(`/list?email=${emailId}`);
      }
    });
  }
});
app.post("/login", async (req, res) => {
  const loginEmailId = req.body.email;
  const loginPassword = req.body.password;
  const result = await User.findOne({ email: loginEmailId });
  if (result) {
    bcrypt.compare(loginPassword,result.password,(err,result)=>{
      if(err){
        console.log("error occured",err);
      }else{
        if(result===true){
          res.redirect(`/list?email=${loginEmailId}`);
        }else{
          console.log("incorrect password");
          res.redirect("/login");
        }
      }
    });
  } else {
    console.log("User doesnt exist");
    res.redirect("/register");
  }
});

app.post("/delete", async function (req, res) {
  const itemId = req.body.itemId;
  const listName = req.body.listName;
  //console.log(itemId);
  if (listName === "Today") {
    await Todo.deleteOne({ _id: itemId });
    res.redirect(`/list?email=${req.body.userEmail}`);
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: itemId } } }
    );
    res.redirect("/" + listName);
  }
});

// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });
// app.get("/:customListName",async function(req,res){
//   const customListName=_.capitalize(req.params.customListName);
//     const result = await List.findOne({name:customListName});
//     if(!result){
//       const list = new List ({
//         name:customListName,
//         items: defaultItems
//       });
//       list.save();
//       res.redirect("/"+customListName);
//     }else{
//       //console.log(result.items);
//       res.render("list.ejs", {listTitle: `${customListName}`, newListItems: result.items});
//     }

// })

// app.get("/about", function(req, res){
//   res.render("about");
// });

app.listen(port, function () {
  console.log(`Server started on port ${port}`);
});
