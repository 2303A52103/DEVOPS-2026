const app = require("./app");
const { sequelize } = require("./models");

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true }); // dev only (auto updates tables)
    console.log("Database connected and synced.");

    app.listen(PORT, () => {
      console.log(`Server running: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

start();