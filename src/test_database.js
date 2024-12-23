// test database

const {
  getItem,
  addItem,
  queryItems,
  deleteItem,
  updateItem,
} = require("./database");

// add database
const partition_key = "user";
const id = "1";
const item = {
  id: id,
  partitionKey: partition_key,
  name: "John Doe",
  email: "john.doe@example.com",
  phone: "1234567890",
};
const item2 = { id: id, partitionKey: partition_key, name: "Jane Doe" };

addItem(item, "user")
  .then(() =>
    getItem(id, partition_key).then((item1) => {
      console.log("getItem");
      console.log(item1);
    })
  )
  .then(() =>
    queryItems(partition_key).then((items) => {
      console.log("queryItems");
      console.log(items);
    })
  )
  .then(() =>
    updateItem(id, partition_key, item2).then((item) => {
      console.log("updateItem");
      console.log(item);
    })
  )
  .then(() =>
    deleteItem(id, partition_key).then((item) => {
      console.log("deleteItem");
      console.log(item);
    })
  );
