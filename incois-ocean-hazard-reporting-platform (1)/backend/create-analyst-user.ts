import { db } from './src/services/database';
import bcrypt from 'bcrypt';

async function createAnalystUser() {
    try {
        console.log('🔄 Creating new analyst user for approval...');
        
        const plainPassword = "AnalystDemo123!";
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        
        const newAnalyst = {
            name: "Dr. Arjun Menon",
            email: "arjun.menon@nio.gov.in",
            password: hashedPassword,
            role: "analyst" as const,
            employeeId: "NIO2024",
            isVerified: false,
            approvalStatus: "pending" as const,
            avatar: ""
        };
        
        const createdUser = await db.createUser(newAnalyst);
        
        console.log('✅ Successfully created analyst user!');
        console.log('📋 User Details:');
        console.log(`   ID: ${createdUser.id}`);
        console.log(`   Name: ${createdUser.name}`);
        console.log(`   Email: ${createdUser.email}`);
        console.log(`   Password: ${plainPassword}`);
        console.log(`   Employee ID: ${createdUser.employeeId}`);
        console.log(`   Role: ${createdUser.role}`);
        console.log(`   Status: ${createdUser.approvalStatus}`);
        console.log('');
        console.log('🎯 Next Steps:');
        console.log('1. Login as Super Admin');
        console.log('2. Go to Admin Approval Page');
        console.log('3. Approve this analyst user');
        console.log('4. Then login with the credentials above');
        
        return {
            id: createdUser.id,
            email: createdUser.email,
            password: plainPassword,
            employeeId: createdUser.employeeId,
            role: createdUser.role
        };
        
    } catch (error) {
        console.error('❌ Error creating analyst user:', error);
        throw error;
    }
}

// Run the script
createAnalystUser()
    .then((credentials) => {
        console.log('🎉 Script completed successfully!');
        console.log('💾 Save these credentials:');
        console.log(`Email: ${credentials.email}`);
        console.log(`Password: ${credentials.password}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Script failed:', error);
        process.exit(1);
    });
