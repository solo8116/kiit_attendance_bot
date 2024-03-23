const express = require("express");
const app = express();
require("dotenv").config();
const attendanceRouter = require("./routes/attendance");

app.use(express.json());
app.use("/api/attendance", attendanceRouter);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`listening on port ${port}`);
});
