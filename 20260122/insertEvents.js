const mongoose = require("mongoose");

/**
 * 1. Connect to MongoDB
 *    ⚠️ NO useNewUrlParser
 *    ⚠️ NO useUnifiedTopology
 */
async function connectDB() {
  await mongoose.connect("mongodb://127.0.0.1:27017/eventsDB");
  console.log("✅ MongoDB connected");
}

/**
 * 2. Event Schema
 */
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  description: String
});

/**
 * 3. Event Model
 */
const Event = mongoose.model("Event", eventSchema);

/**
 * 4. Insert Events
 */
async function insertEvents() {
  try {
    await connectDB();

    await Event.insertMany([
      {
        title: "DevOps Workshop",
        date: new Date("2026-02-10"),
        location: "Hyderabad",
        description: "Hands-on DevOps training"
      },
      {
        title: "Tech Conference",
        date: new Date("2026-03-05"),
        location: "Bangalore",
        description: "Annual technology conference"
      }
    ]);

    console.log("✅ Events inserted successfully");
    await mongoose.connection.close();
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

insertEvents();
