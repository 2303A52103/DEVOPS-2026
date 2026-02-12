const mongoose = require("mongoose");
const express = require("express");
const app = express();

// 1️⃣ CONNECT TO MONGODB (NO OPTIONS AT ALL)
async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/eventsDB");
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
}

// 2️⃣ EVENT SCHEMA
const eventSchema = new mongoose.Schema({
  title: String,
  date: Date,
  location: String,
  description: String
});

// 3️⃣ EVENT MODEL
const Event = mongoose.model("Event", eventSchema);

// 4️⃣ ROUTES
app.get("/", (req, res) => {
  res.send("<h1>Welcome to Events API</h1><p>Go to <a href='/events'>/events</a> to see all events.</p>");
});

app.get("/events", async (req, res) => {
  try {
    const events = await Event.find();
    let html = "<h1>All Events</h1><ul>";
    events.forEach(event => {
      html += `<li><strong>${event.title}</strong> - ${event.date.toDateString()} - ${event.location} - ${event.description}</li>`;
    });
    html += "</ul>";
    res.send(html);
  } catch (err) {
    res.status(500).send("Error fetching events");
  }
});

// 5️⃣ START SERVER
async function startServer() {
  await connectDB();
  app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
  });
}

startServer();
