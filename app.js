//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();


const app = express();
const port = process.env.PORT;
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.MONGODB_CONNECT_URI);
var hrsTime = [];
var minsTime = [];
var hrsTotal=0;
var minTotal=0;

const todoSchema = new mongoose.Schema({
  name:String,
  type:String,
  hrs:Number,
  mins:Number
});

const Todo = mongoose.model("Todo",todoSchema);

function calculateTime(){
  hrsTotal = hrsTime.reduce((partialSum, a) => partialSum + a, 0);
  minTotal = minsTime.reduce((partialSum, a) => partialSum + a, 0);
  hrsTotal += Math.floor(minTotal / 60);
  minTotal%=60;
  //console.log(hrsTotal," ",minTotal);
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

app.get("/", async function(req, res) {
  try {
    const result = await Todo.find();
    hrsTime = [];
    minsTime = [];
    result.forEach(todo => hrsTime.push(todo.hrs));
    result.forEach(todo => minsTime.push(todo.mins));
    calculateTime();
    res.render("list.ejs", {
      listTitle: "Today",
      newListItems: result,
      totalHrs: hrsTotal,
      totalMins: minTotal
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});


app.post("/",async function(req, res){

  const item = req.body;
  const listName = req.body.list;
  //console.log(listName);
  //console.log(item)
  const todo = new Todo({
    name:req.body.newItem,
    type:req.body.list,
    hrs:req.body.hours,
    mins:req.body.mins
  });

  if (req.body.list === "Today") {
    todo.save();
    res.redirect("/");
  } else {
    const result = await List.findOne({name:listName});
    result.items.push(todo);
    result.save();
    res.redirect("/"+listName);
  }
});
app.post("/delete",async function(req,res){
    const itemId = req.body.itemId;
    const listName = req.body.listName;
    //console.log(itemId);
    if(listName==="Today"){
      await Todo.deleteOne({_id:itemId});
      res.redirect("/");
    }else{
     await List.findOneAndUpdate({name:listName},{$pull:{items:{_id:itemId}}});
      res.redirect("/"+listName);
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

app.listen(port, function() {
  console.log(`Server started on port ${port}`);
});
