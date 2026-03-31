const mongoose = require("mongoose");
const dotenv = require("dotenv");
const AIKnowledge = require("../src/models/AIKnowledge");
const medicalData = require("../src/data/medicalKnowledge.json");

dotenv.config();

const seedAI = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB for incremental seeding...");

        // Insert or Update rules one by one (Upsert)
        let added = 0;
        let updated = 0;

        for (const rule of medicalData) {
            const result = await AIKnowledge.updateOne(
                { conditions: rule.conditions.trim() },
                { $set: rule },
                { upsert: true }
            );

            if (result.upsertedCount > 0) added++;
            else if (result.modifiedCount > 0) updated++;
        }

        console.log(`🚀 Seeding Complete! Added: ${added}, Updated: ${updated}.`);
        console.log("💎 Admin-taught rules were preserved.");

        process.exit();
    } catch (err) {
        console.error("❌ Seeding Error:", err.message);
        process.exit(1);
    }
};

seedAI();
