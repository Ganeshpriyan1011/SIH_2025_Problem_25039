const express = require("express");
const router = express.Router();
const { validateReport } = require("../validationService");
const userData = require("../sampleData/userReports.json");

router.get("/", (req, res) => {
  const validated = userData.map((r) => ({
    ...r,
    ...validateReport(r),
  }));
  res.json(validated);
});

module.exports = router;
