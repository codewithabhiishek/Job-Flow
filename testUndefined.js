import { db } from './api/db.js';
import { jobs } from './api/schema.js';

async function test() {
  try {
    const dbPayload = {
      company: "Test",
      logo: undefined,
      user_id: "user_123"
    };
    
    // Clean undefined values
    const cleanPayload = Object.fromEntries(
      Object.entries(dbPayload).filter(([_, v]) => v !== undefined)
    );
    
    console.log("Original Payload:", dbPayload);
    console.log("Cleaned Payload:", cleanPayload);
    
    // Try to insert with undefined
    console.log("Inserting with undefined...");
    await db.insert(jobs).values(dbPayload).returning();
  } catch (err) {
    console.error("Error with undefined:", err.message);
  }
}
test();
