//jshint esversion:6
//changes from version 1 include
// - connection to mongodb database through mongoose
// - detleted items array and replaced with items model for mongodb
// - simplified app by delete date.js and const day
// - added name method to newListItems in list.ejs
// - changed for loop to for.each in list.ejs

const express = require("express");
const moment = require("moment");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect("mongodb+srv://username:password@todoapp.5cbsy.mongodb.net/todolistDB");    //connecting to mongoose

momentDate = moment().format('MMM Do YY');             //passing moment.js into ejs with res render below

const itemsSchema = {
  name: String
};                                                           //schema for todolist

const Item = mongoose.model(                                 //create items model/collection/table // mongoose lowercases and pluralizes model names automatically
  "Item",
  itemsSchema
);

const item1 = new Item ({                                     //create 3 defualt items
  name: "Welcome to your todolist."
});

const item2 = new Item ({
  name: "Hit the + button to add a new item."
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];                   //insert the 3 defualt items create above to an array called defaultItems

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

Item.find({}, function(err, foundItems){

  if (foundItems.length === 0) {
    Item.insertMany(defaultItems, function(err){                  //insert the array above to the model Item(items)
      if (err) {
        console.log(err);
      } else {
        console.log("Sucessfully saved defualt items to DB.")
      }
    });
    res.redirect("/");
  } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems, momentDate});  // putting res.render in the function  //use find method from mongodb to read array of items in Item(items) model/collection
  }
  });

});

app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //show an existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }
    }
  });



});

app.post("/", function(req, res){

  const itemName = req.body.newItem;                                     // getting new entry from user
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();                                                           // using save method from mongodb
    res.redirect("/");                                                     //// redirecting to home route again to display new entry
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
    if (!err){
      res.redirect("/" + listName);
    }
  });
  }
});

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}                         //heroku port


app.listen(port, function() {
  console.log("Server has started successfully");
});
