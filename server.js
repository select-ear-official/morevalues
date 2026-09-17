/**
 * server.js
 * Entry point for the backend server.
 * Initializes the database connection, schedules background tasks,
 * and starts listening for incoming HTTP requests on the specified port.
 */
import { app } from './src/app.js';
import { dbManager } from './src/dbManager.js';

// Define the port to listen on. Defaults to 4000 if not specified in the environment.
const PORT = process.env.PORT || 4000;

// Initialize the database connection before starting the server
dbManager.init().then(() => {
  /**
   * Background Task: Recycle Bin Cleanup
   * Runs every 24 hours (24 * 60 * 60 * 1000 ms).
   * Permanently deletes any tests in the recycle bin that have exceeded their retention period.
   */
  setInterval(async () => {
    try {
      await dbManager.cleanupRecycleBin();
      console.log('Ran daily recycle bin cleanup task.');
    } catch (err) {
      console.error('Failed to run daily cleanup:', err);
    }
  }, 24 * 60 * 60 * 1000);

  // Start the Express server
  app.listen(PORT, () => {
    console.log(`8values Publisher Backend running on http://localhost:${PORT}`);
  });
}).catch(err => {
  // If the database fails to initialize, log the error and terminate the process
  console.error("Failed to initialize database:", err);
  process.exit(1);
});
