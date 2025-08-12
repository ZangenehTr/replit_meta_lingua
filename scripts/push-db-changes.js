// Script to force push database changes
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function pushDbChanges() {
  try {
    console.log('Pushing database schema changes...');
    
    // Use echo to automatically select "create table" option (option 1)
    const { stdout, stderr } = await execPromise('echo -e "1\\n1\\n1\\n1\\n1\\n1\\n1\\n1\\n1\\n1\\n" | npm run db:push');
    
    console.log('Output:', stdout);
    if (stderr) {
      console.error('Errors:', stderr);
    }
    
    console.log('Database changes pushed successfully!');
  } catch (error) {
    console.error('Error pushing database changes:', error);
    process.exit(1);
  }
}

pushDbChanges();