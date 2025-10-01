const { BlobServiceClient } = require('@azure/storage-blob');
const bcrypt = require('bcrypt');

// Azure Storage configuration
const AZURE_STORAGE_CONNECTION_STRING = "DefaultEndpointsProtocol=https;AccountName=incoishazardreports;AccountKey=your_key_here;EndpointSuffix=core.windows.net";
const CONTAINER_NAME = "hazard-reports";

async function createAnalystUser() {
    try {
        console.log('🔄 Creating new analyst user for approval...');
        
        // Create BlobServiceClient
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
        
        // Download existing users data
        const usersBlobClient = containerClient.getBlobClient('users.json');
        let users = [];
        
        try {
            const downloadResponse = await usersBlobClient.download();
            const downloadedContent = await streamToString(downloadResponse.readableStreamBody);
            users = JSON.parse(downloadedContent);
            console.log(`📄 Found ${users.length} existing users`);
        } catch (error) {
            console.log('📄 No existing users file found, creating new one');
        }
        
        // Create new analyst user
        const newAnalyst = {
            id: `user_${Date.now()}_analyst_demo`,
            name: "Dr. Arjun Menon",
            email: "arjun.menon@nio.gov.in",
            password: await bcrypt.hash("AnalystDemo123!", 10), // This is the password: AnalystDemo123!
            role: "analyst",
            employeeId: "NIO2024",
            department: "Marine Sciences Division",
            designation: "Senior Marine Analyst",
            organization: "National Institute of Oceanography",
            isVerified: false,
            approvalStatus: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            avatar: ""
        };
        
        // Add to users array
        users.push(newAnalyst);
        
        // Upload updated users data
        const updatedUsersData = JSON.stringify(users, null, 2);
        await usersBlobClient.upload(updatedUsersData, updatedUsersData.length, {
            overwrite: true,
            blobHTTPHeaders: { blobContentType: 'application/json' }
        });
        
        console.log('✅ Successfully created analyst user!');
        console.log('📋 User Details:');
        console.log(`   Name: ${newAnalyst.name}`);
        console.log(`   Email: ${newAnalyst.email}`);
        console.log(`   Password: AnalystDemo123!`);
        console.log(`   Employee ID: ${newAnalyst.employeeId}`);
        console.log(`   Role: ${newAnalyst.role}`);
        console.log(`   Status: ${newAnalyst.approvalStatus}`);
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('1. Login as Super Admin');
        console.log('2. Go to Admin Approval Page');
        console.log('3. Approve this analyst user');
        console.log('4. Then login with the credentials above');
        
    } catch (error) {
        console.error('❌ Error creating analyst user:', error);
    }
}

// Helper function to convert stream to string
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (data) => {
            chunks.push(data.toString());
        });
        readableStream.on('end', () => {
            resolve(chunks.join(''));
        });
        readableStream.on('error', reject);
    });
}

// Run the script
createAnalystUser();
