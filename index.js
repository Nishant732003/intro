const express = require("express");

const categoryRoute = require("./routes/categoryRoute");
const productRoute = require("./routes/productRoutes");
const app = express();
app.use(express.json());
app.use('/api/v1',categoryRoute);
app.use('/api/v1', productRoute);


app.listen(3000, () => {
  console.log("Server Started on port 3000");
});
