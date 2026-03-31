require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const User = require("./models/User");
const bcrypt = require("bcryptjs");

const createDefaultAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: "admin" });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            await User.create({
                name: "System Admin",
                email: "admin@medinest.com",
                password: hashedPassword,
                role: "admin",
                isApproved: true
            });
            console.log("✅ Default Admin Created: admin@medinest.com / admin123");
        }
    } catch (err) {
        console.error("Error creating default admin:", err);
    }
};

connectDB().then(() => {
    createDefaultAdmin();
});

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${process.env.PORT}`);
});
