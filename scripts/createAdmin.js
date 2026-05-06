require("dotenv").config({ path: ".env.local" });
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const hash = await bcrypt.hash("admin123", 10);
  await mongoose.connection.collection("users").insertOne({
    username: "admin",
    password: hash,
  });
  console.log("done");
  process.exit();
}
main();
