const express = require("express");
const router = express.Router();
const bot = require("../bot");

router.get("/", async (req, res) => {
  const { username, password } = req.query;
  var bunk = [];
  var attend = [];
  try {
    const details = await bot(username, password);
    details.map((detail) => {
      if (detail["Total Percentage"] >= 75.0) {
        var bunkDays = 0;
        var present = detail["No.of Present"];
        var total = detail["Total No. of Days"];
        while ((present * 100) / ++total > 75) {
          bunkDays += 1;
        }
        var percentage = (present * 100) / --total;
        bunk.push({ subject: detail["Subject"], days: bunkDays, percentage });
      }
      if (detail["Total Percentage"] < 75.0) {
        var attendDays = 0;
        var present = detail["No.of Present"];
        var total = detail["Total No. of Days"];
        while ((present++ * 100) / total++ < 75) {
          attendDays += 1;
        }
        var percentage = (--present * 100) / --total;
        attend.push({
          subject: detail["Subject"],
          days: attendDays,
          percentage,
        });
      }
    });
    res.status(200).json({ success: true, data: details, bunk, attend });
  } catch (error) {
    return res.status(400).json({ success: false, msg: error.message });
  }
});

module.exports = router;
