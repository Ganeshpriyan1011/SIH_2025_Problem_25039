const express = require("express");
const router = express.Router();
const { validateReport } = require("../validationService");
const socialMediaData = require("../sampleData/socialMedia.json");

router.get("/", (req, res) => {
  const validated = socialMediaData.map((r) => ({
    ...r,
    ...validateReport(r),
  }));
  res.json(validated);
});

module.exports = router;
