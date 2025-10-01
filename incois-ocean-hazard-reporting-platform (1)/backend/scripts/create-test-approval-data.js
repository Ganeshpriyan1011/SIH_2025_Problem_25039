const { BlobServiceClient } = require('@azure/storage-blob');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Test users for super admin approval system
const testUsers = [
  {
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@incois.gov.in',
    password: 'OfficialPass123!',
    role: 'official',
    employeeId: 'INCOIS001',
    approvalStatus: 'pending'
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@nio.gov.in',
    password: 'AnalystPass123!',
    role: 'analyst',
    employeeId: 'NIO002',
    approvalStatus: 'pending'
  },
  {
    name: 'Commander Vikram Singh',
    email: 'vikram.singh@indiannavy.gov.in',
    password: 'NavyOfficial123!',
    role: 'official',
    employeeId: 'IN003',
    approvalStatus: 'pending'
  },
  {
    name: 'Dr. Meera Nair',
    email: 'meera.nair@isro.gov.in',
    password: 'SpaceAnalyst123!',
    role: 'analyst',
    employeeId: 'ISRO004',
    approvalStatus: 'pending'
  },
  {
    name: 'Arjun Patel',
    email: 'arjun.patel@coastguard.gov.in',
    password: 'CoastGuard123!',
    role: 'official',
    employeeId: 'ICG005',
    approvalStatus: 'pending'
  }
];

async function createTestApprovalData() {
  try {
    console.log('🔧 Creating test approval data...');

    // Initialize Azure Storage
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const containerName = process.env.CONTAINER_NAME || 'user-data';
    
    if (!connectionString) {
      throw new Error('Azure Storage connection string is required');
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    // Ensure container exists
    await containerClient.createIfNotExists();

    // Read existing users
    let existingUsers = [];
    try {
      const blobClient = containerClient.getBlobClient('users.json');
      const downloadResponse = await blobClient.download();
      
      if (downloadResponse.readableStreamBody) {
        const chunks = [];
        for await (const chunk of downloadResponse.readableStreamBody) {
          chunks.push(Buffer.from(chunk));
        }
        const content = Buffer.concat(chunks).toString();
        existingUsers = JSON.parse(content);
      }
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error;
      }
      console.log('📄 No existing users.json found, creating new one');
    }

    // Create test users
    const newUsers = [];
    for (const testUser of testUsers) {
      // Check if user already exists
      const existingUser = existingUsers.find(u => u.email === testUser.email);
      if (existingUser) {
        console.log(`👤 User ${testUser.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      const user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: testUser.name,
        email: testUser.email,
        password: hashedPassword,
        role: testUser.role,
        employeeId: testUser.employeeId,
        isVerified: false,
        approvalStatus: testUser.approvalStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        avatar: ''
      };

      newUsers.push(user);
      existingUsers.push(user);
      console.log(`✅ Created test user: ${user.name} (${user.email})`);
    }

    // Save updated users list
    const blobClient = containerClient.getBlobClient('users.json');
    const content = JSON.stringify(existingUsers, null, 2);
    
    const blockBlobClient = blobClient.getBlockBlobClient();
    await blockBlobClient.upload(content, content.length, {
      blobHTTPHeaders: {
        blobContentType: 'application/json'
      }
    });

    console.log(`🎉 Successfully created ${newUsers.length} test users for approval system`);
    console.log(`📊 Total users in system: ${existingUsers.length}`);
    console.log(`⏳ Pending approvals: ${existingUsers.filter(u => u.approvalStatus === 'pending').length}`);

    // Display test credentials
    console.log('\n📋 Test User Credentials:');
    testUsers.forEach(user => {
      console.log(`   ${user.name}: ${user.email} / ${user.password} / ${user.employeeId}`);
    });

  } catch (error) {
    console.error('❌ Error creating test approval data:', error);
    process.exit(1);
  }
}

// Run the script
createTestApprovalData().then(() => {
  console.log('\n✨ Test data creation completed!');
  process.exit(0);
});
