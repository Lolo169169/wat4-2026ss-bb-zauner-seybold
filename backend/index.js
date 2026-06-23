require("dotenv").config();
const env = process.env.NODE_ENV || "development";
const PORT = process.env.PORT || 3001;
const app = require("./app");
const { sequelize } = require("./models");

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log(`Connection with ${env} database has been established.`);
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`),
);
