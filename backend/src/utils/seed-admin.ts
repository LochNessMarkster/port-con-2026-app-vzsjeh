import { createApplication } from "@specific-dev/framework";
import * as appSchema from '../db/schema.js';
import * as authSchema from '../db/auth-schema.js';

/**
 * Seed script to create initial admin user
 * Usage: npx tsx src/utils/seed-admin.ts <email> <password> <name>
 * Example: npx tsx src/utils/seed-admin.ts admin@conference.com MySecurePass123 Admin
 */

async function seedAdmin() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('Usage: npx tsx src/utils/seed-admin.ts <email> <password> <name>');
    console.error('Example: npx tsx src/utils/seed-admin.ts admin@conference.com MySecurePass123 "Admin User"');
    process.exit(1);
  }

  const [email, password, name] = args;

  // Validate inputs
  if (!email.includes('@')) {
    console.error('Error: Invalid email format');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters');
    process.exit(1);
  }

  if (name.length === 0) {
    console.error('Error: Name cannot be empty');
    process.exit(1);
  }

  try {
    const schema = { ...appSchema, ...authSchema };
    const app = await createApplication(schema);

    console.log('🌱 Seeding admin user...');
    console.log(`   Email: ${email}`);
    console.log(`   Name: ${name}`);

    // Check if user already exists
    const existingUser = await app.db.query.user.findFirst({
      where: (user, { eq }) => eq(user.email, email),
    });

    if (existingUser) {
      console.error(`❌ User with email ${email} already exists`);
      process.exit(1);
    }

    // Create user via Better Auth signUp
    try {
      const response = await fetch('http://localhost:3000/api/auth/sign-up/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to create user:', error);
        process.exit(1);
      }

      const result = await response.json() as any;
      console.log('✅ Admin user created successfully!');
      console.log(`   User ID: ${result?.user?.id || 'N/A'}`);
      console.log(`\n📝 You can now sign in with:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
    } catch (fetchError) {
      // Fallback: Create user directly in database with hashed password
      console.log('⚠️  Could not reach auth endpoint, attempting direct database insertion...');

      // Note: This requires bcrypt to hash the password
      // For now, just log instructions
      console.log('Please ensure the application is running and try again.');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seedAdmin();
