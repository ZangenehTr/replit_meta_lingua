import { DatabaseStorage } from '../server/database-storage.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

async function setupSecureAdmin() {
  console.log('🔐 Setting up secure admin credentials...');
  
  try {
    const storage = new DatabaseStorage();
    
    // Generate a cryptographically secure password
    const randomBytes = crypto.randomBytes(32);
    const securePassword = 'MetaLingua2025!' + randomBytes.toString('base64').slice(0, 16).replace(/[/+=]/g, 'x');
    const hashedPassword = await bcrypt.hash(securePassword, 14);
    
    // Find existing admin user
    const adminUser = await storage.getUserByEmail('admin@test.com');
    
    if (adminUser) {
      // Update existing admin with secure password
      await storage.updateUserPassword(adminUser.id, hashedPassword);
      await storage.updateUser(adminUser.id, {
        firstName: 'Meta Lingua',
        lastName: 'Administrator',
        role: 'Admin', // Use proper capitalization for RBAC
        isActive: true,
        preferences: { 
          ...adminUser.preferences, 
          mustChangePassword: true, // Use preferences until schema is updated
          securitySetupCompleted: true
        }
      });
      
      // Invalidate all existing admin sessions for security
      await storage.invalidateAllUserSessions(adminUser.id);
      
      console.log('✅ Admin account security updated successfully!');
      console.log('\n🔒 SECURE ADMIN CREDENTIALS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Email:    admin@test.com`);
      console.log(`Password: [GENERATED - Check return value]`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('\n⚠️  CRITICAL SECURITY NOTES:');
      console.log('1. Password is NOT logged for security');
      console.log('2. All existing admin sessions invalidated');
      console.log('3. Admin MUST change password on first login (enforced)');
      console.log('4. Old weak password (admin123) is now invalid');
      console.log('5. Use bcrypt cost factor 14 for enhanced security');
      
      return {
        success: true,
        email: 'admin@test.com',
        password: securePassword
      };
    } else {
      // Create new secure admin user
      const newAdmin = await storage.createUser({
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'Admin',
        firstName: 'Meta Lingua',
        lastName: 'Administrator',
        phoneNumber: '+1-555-ADMIN',
        isActive: true,
        preferences: { 
          mustChangePassword: true, // Use preferences until schema is updated
          securitySetupCompleted: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Secure admin account created successfully!');
      console.log('\n🔒 NEW ADMIN CREDENTIALS:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Email:    admin@test.com`);
      console.log(`Password: [GENERATED - Check return value]`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      return {
        success: true,
        email: 'admin@test.com',
        password: securePassword
      };
    }
  } catch (error) {
    console.error('❌ Failed to setup secure admin:', error);
    return { success: false, error: error.message };
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupSecureAdmin()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Admin security setup completed successfully!');
      } else {
        console.error('\n💥 Admin security setup failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

// SECURE CREDENTIAL RETRIEVAL FUNCTION
// Only for immediate use - credentials should never be logged or stored
export async function getSecureAdminCredentials() {
  const result = await setupSecureAdmin();
  if (result.success) {
    // Return credentials securely without logging
    return {
      email: result.email,
      password: result.password,
      note: 'These credentials are for immediate use only. Save in secure password manager and change on first login.'
    };
  }
  return null;
}

export { setupSecureAdmin };