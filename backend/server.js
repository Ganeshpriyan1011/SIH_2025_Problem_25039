import express from "express";
import multer from "multer";
import cors from "cors";
import dotenv from "dotenv";
import { BlobServiceClient } from "@azure/storage-blob";

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Azure Blob Setup
let blobServiceClient;
let containerClient;

try {
  console.log('Attempting to connect to Azure Blob Storage...');
  blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  containerClient = blobServiceClient.getContainerClient(process.env.CONTAINER_NAME);
  console.log('Successfully connected to Azure Blob Storage');
} catch (error) {
  console.error('Failed to connect to Azure Blob Storage:', error.message);
  process.exit(1);
}

// Upload hazard report (file + metadata JSON)
app.post("/api/v1/reports", upload.single("media"), async (req, res) => {
  try {
    const { event_type, description, severity, lat, lng, timestamp } = req.body;

    let mediaUrl = null;

    // 1. Upload file (if provided)
    if (req.file) {
      const blobName = `${Date.now()}-${req.file.originalname}`;
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(req.file.buffer, {
        blobHTTPHeaders: { blobContentType: req.file.mimetype },
      });

      mediaUrl = blockBlobClient.url;
    }

    // 2. Create metadata object
    const reportData = {
      event_type,
      description,
      severity: parseInt(severity),
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      timestamp: timestamp || new Date().toISOString(),
      mediaUrl,
    };

    // 3. Save metadata as JSON blob
    const metadataBlobName = `${Date.now()}-report.json`;
    const metadataBlockBlob = containerClient.getBlockBlobClient(metadataBlobName);

    await metadataBlockBlob.uploadData(Buffer.from(JSON.stringify(reportData, null, 2)), {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });

    res.json({ success: true, report: reportData });
  } catch (err) {
    console.error("Upload failed:", err.message);
    res.status(500).json({ error: "Failed to upload report" });
  }
});

// Fetch all reports (list JSON blobs only)
app.get("/api/v1/reports", async (req, res) => {
  try {
    const reports = [];
    for await (const blob of containerClient.listBlobsFlat()) {
      if (blob.name.endsWith(".json")) {
        const blobClient = containerClient.getBlobClient(blob.name);
        const downloadBlockBlob = await blobClient.download();
        const downloaded = await streamToString(downloadBlockBlob.readableStreamBody);
        reports.push(JSON.parse(downloaded));
      }
    }
    res.json({ success: true, reports });
  } catch (err) {
    console.error("Fetch reports failed:", err.message);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
});

// Helper to convert stream to string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}

// Test endpoint
app.get('/api/v1/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

const server = app.listen(process.env.PORT, () => {
  console.log(`API running on http://localhost:${process.env.PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Performing graceful shutdown...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Performing graceful shutdown...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
