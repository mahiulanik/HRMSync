import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const fixIndexes = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB Atlas");

    const db = mongoose.connection.db;
    const indexes = await db.collection("attendances").indexes();
    console.log("Current indexes:");
    indexes.forEach(i => console.log(" -", i.name, JSON.stringify(i.key)));

    for (const idx of indexes) {
        const keys = Object.keys(idx.key);
        if (keys.length === 1 && keys[0] === "employeeId" && idx.unique) {
            console.log(`\nDropping stale unique index: ${idx.name}`);
            await db.collection("attendances").dropIndex(idx.name);
            console.log("Done.");
        }
    }

    const finalIndexes = await db.collection("attendances").indexes();
    console.log("\nIndexes after cleanup:");
    finalIndexes.forEach(i => console.log(" -", i.name, JSON.stringify(i.key)));

    process.exit(0);
};

fixIndexes().catch(e => { console.error(e); process.exit(1); });
