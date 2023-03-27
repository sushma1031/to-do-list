const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(express.static("public"));

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/toDoListDB");

const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcome to your To-Do list!",
});

const defaultItems = [item1];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema],
});

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Item.find({})
    .then((items) => {
      if (items.length === 0) {
        Item.insertMany(defaultItems)
          .then(() => console.log("Insertion successful"))
          .catch((err) => console.log("Error encountered: " + err));

        res.redirect("/");
      } else {
        res.render("list", { listTitle: "Today", newListItems: items });
      }
    })
    .catch((err) => console.log(err));
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const nextItem = new Item({
    name: itemName,
  });

  if (listName == "Today") {
    nextItem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }).then((foundList) => {
      foundList.items.push(nextItem);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName == "Today") {
    Item.findByIdAndRemove(checkedItemId)
      .then(() => console.log("Delete successful"))
      .catch((err) => console.log(err));
    res.redirect("/");
  }

  const update = { $pull: { items: { _id: checkedItemId } } };

  List.findOneAndUpdate({ name: listName }, update).then(() => {
    res.redirect("/" + listName);
  });
});

app.get("/:customListName", function (req, res) {
  let customListName = req.params.customListName;
  const listNameCapitalized = customListName.charAt(0).toUpperCase() + customListName.slice(1).toLowerCase();

  List.findOne({ name: listNameCapitalized })
    .then((list) => {
      if (!list) {
        const list = new List({
          name: listNameCapitalized,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + listNameCapitalized);
      } else {
        res.render("list", { listTitle: list.name, newListItems: list.items });
      }
    })
    .catch((err) => console.log("Error: " + error));
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
