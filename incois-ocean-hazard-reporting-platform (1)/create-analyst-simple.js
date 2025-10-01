const https = require('https');
const http = require('http');

function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const protocol = options.port === 443 ? https : http;
        const req = protocol.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve({ status: res.statusCode, data: result });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function createAnalystForApproval() {
    try {
        console.log('🔄 Creating new analyst user for approval...');
        
        const analystData = {
            name: "Dr. Kavya Nair",
            email: "kavya.nair@nio.gov.in",
            password: "AnalystDemo2024!",
            role: "analyst",
            employeeId: "NIO2024"
        };
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/admin/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(analystData).length
            }
        };
        
        const response = await makeRequest(options, analystData);
        
        if (response.status === 200 || response.status === 201) {
            console.log('✅ Successfully created analyst user for approval!');
        } else {
            console.log('⚠️ Response status:', response.status);
            console.log('Response:', response.data);
        }
        
        console.log('📋 User Details:');
        console.log(`   Name: ${analystData.name}`);
        console.log(`   Email: ${analystData.email}`);
        console.log(`   Password: ${analystData.password}`);
        console.log(`   Employee ID: ${analystData.employeeId}`);
        console.log(`   Role: ${analystData.role}`);
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('1. Login as Super Admin');
        console.log('2. Go to Admin Approval Page');
        console.log('3. You should see this analyst user pending approval');
        console.log('4. Approve the user');
        console.log('5. Then login with the credentials above');
        console.log('');
        console.log('💾 SAVE THESE CREDENTIALS:');
        console.log(`Email: ${analystData.email}`);
        console.log(`Password: ${analystData.password}`);
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.error('❌ Network Error: Backend server might not be running');
            console.log('💡 Make sure the backend server is running on http://localhost:5000');
            console.log('💡 You can start it with: cd backend && npm run dev');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Run the script
createAnalystForApproval();
