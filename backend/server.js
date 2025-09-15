require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { validateReport } = require("./validationService");
const socialMediaData = require("./sampleData/socialMedia.json");
const { BlobServiceClient } = require("@azure/storage-blob");
const { getMarineData } = require("./weatherService"); // your OpenWeatherMap fetch function

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

if (!AZURE_STORAGE_CONNECTION_STRING) {
  console.error("❌ AZURE_STORAGE_CONNECTION_STRING is not defined in .env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Helper to convert stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => chunks.push(data.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}

// Fetch reports from Azure Blob Storage
async function fetchUserReports() {
  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

  const reports = [];

  for await (const blob of containerClient.listBlobsFlat()) {
    if (!blob.name.toLowerCase().endsWith(".json")) continue;

    const blobClient = containerClient.getBlobClient(blob.name);
    const downloadBlockBlobResponse = await blobClient.download();
    const downloaded = await streamToString(downloadBlockBlobResponse.readableStreamBody);

    try {
      const jsonData = JSON.parse(downloaded);
      const report = {
        ...jsonData,
        source: "App",
        lat: jsonData.lat,
        lon: jsonData.lng ?? jsonData.lon, // normalize lon/lng
      };
      reports.push(report);
    } catch (err) {
      console.error(`Error parsing blob ${blob.name}:`, err);
    }
  }

  return reports;
}

// Normalize coordinates helper
function getCoordinates(report) {
  const latitude = report.lat;
  const longitude = report.lon ?? report.lng;
  if (latitude == null || longitude == null) return null; // invalid coordinates
  return { latitude, longitude };
}

// Social Media reports
app.get("/api/v1/socialmedia", async (req, res) => {
  try {
    const validated = await Promise.all(
      socialMediaData.map(async (r) => {
        const coords = getCoordinates(r);
        if (!coords) return { ...r, wave: null, wind: null, status: "Invalid coordinates" };

        const marine = await getMarineData(coords.latitude, coords.longitude);
        const v = await validateReport({ ...r, ...marine });
        return { ...r, ...v, wave: v.waveHeight, wind: v.windSpeed };
      })
    );
    res.json(validated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch social media reports" });
  }
});

// User reports
app.get("/api/v1/userreports", async (req, res) => {
  try {
    const userReports = await fetchUserReports();
    const validated = await Promise.all(
      userReports.map(async (r) => {
        const coords = getCoordinates(r);
        if (!coords) return { ...r, wave: null, wind: null, status: "Invalid coordinates" };

        const marine = await getMarineData(coords.latitude, coords.longitude);
        const v = await validateReport({ ...r, ...marine });
        return { ...r, ...v, wave: v.waveHeight, wind: v.windSpeed };
      })
    );
    res.json(validated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user reports from Azure" });
  }
});

// Combined endpoint
app.get("/api/v1/validated-events", async (req, res) => {
  try {
    const userReports = await fetchUserReports();
    const combined = await Promise.all(
      [...socialMediaData, ...userReports].map(async (r) => {
        const coords = getCoordinates(r);
        if (!coords) return { ...r, wave: null, wind: null, status: "Invalid coordinates" };

        const marine = await getMarineData(coords.latitude, coords.longitude);
        const v = await validateReport({ ...r, ...marine });
        return { ...r, ...v, wave: v.waveHeight, wind: v.windSpeed };
      })
    );
    res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch combined events" });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
