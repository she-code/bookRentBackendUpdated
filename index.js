const app = require("./app");

//start the server
app.listen(process.env.PORT || 3000, () => {
  console.log("server started on port", process.env.PORT);
});
