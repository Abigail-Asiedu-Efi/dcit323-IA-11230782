import "dotenv/config";
import app from "./src/app.js";
import connectDatabase from "./src/config/db.js";

const PORT = process.env.PORT || 5000;

connectDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to start API:", error.message);
    process.exit(1);
  });
