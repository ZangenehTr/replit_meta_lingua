import { db } from './server/db';
import { studentCallernPackages, callernPackages } from './shared/schema';

async function checkPackages() {
  console.log('Checking Callern packages...\n');
  
  // Check package definitions
  const packageDefs = await db.select().from(callernPackages);
  console.log('Available Callern package definitions:');
  console.log(packageDefs);
  
  // Check student packages
  const studentPkgs = await db.select().from(studentCallernPackages);
  console.log('\nStudent Callern packages:');
  console.log(studentPkgs);
  
  process.exit(0);
}

checkPackages().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});