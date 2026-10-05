const { MongoClient } = require("mongodb");

const readClient = new MongoClient(process.env.MONGO_READ_URI);
const writeClient = new MongoClient(process.env.MONGO_WRITE_URI);

let readDB;
let writeDB;

async function connectDatabases() {
    try {
        await readClient.connect();
        console.log("✅ READ account connected");

        await writeClient.connect();
        console.log("✅ WRITE account connected");

        readDB = readClient.db("DB_23ITB159");
        writeDB = writeClient.db("DB_23ITB159");

        console.log("✅ Connected to DB_23ITB159");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw error;
    }
}

function getReadDB() {
    if (!readDB) {
        throw new Error("Read database is not connected");
    }
    return readDB;
}

function getWriteDB() {
    if (!writeDB) {
        throw new Error("Write database is not connected");
    }
    return writeDB;
}

module.exports = {
    connectDatabases,
    getReadDB,
    getWriteDB
};