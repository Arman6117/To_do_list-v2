const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const lodash = require("lodash")
const app = express();
let day;
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.set("strictQuery", true);
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to do list",
});
const item2 = new Item({
  name: "Hit + icon to add a new task",
});
const item3 = new Item({
  name: "Hit the checkbox after you comleted tha task",
});

const defaultItems = [item1, item2, item3];

const listsSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});
const List = mongoose.model("List", listsSchema);

app.get("/", function (req, res) {
  day = date.getDate();

  Item.find(function (err, results) {
    if (results.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Success");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: results });
    }
  });

  app.get("/:customListName", function (req, res) {
    const customListName = lodash.capitalize(req.params.customListName);

    List.findOne({ name: customListName }, function (err, results) {
      if (!err) {
        if (!results) {
          //Create a list
          const list = new List({
            name: customListName,
            items: defaultItems,
          });
          list.save();
          res.redirect("/" + customListName);
        } else {
          // Show list
          res.render("list", {
            listTitle: results.name,
            newListItems: results.items,
          });
        }
      }
    });
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName == day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, results) {
      results.items.push(item);
      results.save();
      res.redirect("/" + listName);
    });
  }

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete", function (req, res) {

  const deleteID = req.body.deleteItem;

  const listName = req.body.listName;

  if (listName == day) {

    Item.findByIdAndRemove(deleteID, function (err) {

      if (err) {

        console.log(err);

      } else {

        res.redirect("/");

      }
    });

  }
   else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: deleteID } } },
      function (err, results) {

        if (err) {
          console.log(err);
        } else res.redirect("/" + listName);
      }

    );

  }

});

// app.get("/work", function (req, res) {
//   res.render("list", { listTitle: "Work List", newListItems: workItems });
// });

// app.get("/about", function (req, res) {
//   res.render("about");
// });

app.listen(3000, function () {
  console.log("Server started on port 3000");
});
