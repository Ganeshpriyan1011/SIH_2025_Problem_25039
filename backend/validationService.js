function validateReport(report) {
  const waveHeight = parseFloat((Math.random() * 5).toFixed(1));
  const windSpeed = parseFloat((Math.random() * 100).toFixed(1));

  const confidence = Math.min(
    100,
    waveHeight * 15 + windSpeed * 0.5 + (report.reports_count || 0) * 10
  ).toFixed(0);

  let status = "Rejected";
  let reason = "";

  if (report.source === "App") {
    if (report.reports_count >= 10 || report.media_count > 0) reason = "Enough reports/media";
    else if (report.reports_count >= 5) reason = "Borderline reports (5-9)";
    else reason = "Too few reports, no media";
  } else if (report.source === "SocialMedia") {
    if (report.verified_user) reason = "Verified account";
    else if (report.reports_count >= 5) reason = "Multiple unverified posts";
    else if (report.reports_count >= 2) reason = "Some unverified posts";
    else reason = "Single unverified post";
  } else {
    reason = "Unknown source";
  }

  if (confidence > 80) status = "Confirmed Hazard";
  else if (confidence > 50) status = "On Hold";

  return { status, reason, waveHeight, windSpeed, confidence };
}

module.exports = { validateReport };
