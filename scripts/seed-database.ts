/**
 * Database Seeding Script
 * 
 * Seeds the E2E test database with test data.
 * Run with: npx ts-node scripts/seed-database.ts
 */

import { DataSeeder } from '../fixtures/DataSeeder';
import { defaultFixtures } from '../fixtures/defaultFixtures';

async function main() {
  const seeder = new DataSeeder();
  
  try {
    console.log('Connecting to MongoDB...');
    await seeder.connect();
    
    console.log('Seeding test data...');
    await seeder.seedAll(defaultFixtures);
    
    console.log('✅ Database seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    process.exit(1);
  } finally {
    await seeder.disconnect();
  }
}

main();
