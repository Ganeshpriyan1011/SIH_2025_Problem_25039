// Using fetch instead of axios for better compatibility
const fetch = require('node-fetch');

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
        
        // Call the admin registration endpoint
        const response = await fetch('http://localhost:5000/api/auth/admin/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(analystData)
        });
        
        const result = await response.json();
        
        console.log('✅ Successfully created analyst user for approval!');
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
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Run the script
createAnalystForApproval();
