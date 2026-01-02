const mongoose = require("mongoose");

// --- 1. Users Schema ---
const userSchema = new mongoose.Schema({
    // _id is automatically created by Mongoose (matches 'id' string pk in diagram)
    username: { type: String, required: true },
    hashed_password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Admin', 'Regular', 'Flagged'] }, // Role-based access

    // Flagging / Moderation fields
    is_flagged: { type: Boolean, default: false },
    flagged_at: { type: Date, default: null },
    flagged_by: { type: String, default: null }, // Stores Admin ID

    created_at: { type: Date, default: Date.now },
    last_login: { type: Date, default: null },
    status: { type: String, default: 'active' } // e.g., active, suspended
});

// --- 2. Reports Schema ---
const reportSchema = new mongoose.Schema({
    title: { type: String, required: true },
    creatorId: { type: String, required: true }, // Links to User._id
    mediaUrl: { type: String, required: true },  // URL from Blob Storage

    // GeoJSON Object for location queries
    geospatial: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true }
    },

    // Integrity fields
    hash: { type: String, required: true },         // SHA-256 of the file
    previousHash: { type: String, default: "" },    // Links to previous report (Blockchain style)

    timestamp: { type: Date, default: Date.now },

    // AI Analysis Data
    aiConfidenceScore: { type: Number, default: 0.0 },
    aiAnalysisDetails: { type: Object, default: {} }, // Flexible object for JSON results

    // Moderation Status
    status: { type: String, default: "Under Review" }, // real, potential_fake, archived
    archived_at: { type: Date, default: null },
    archived_by: { type: String, default: null }
});

// Create a geospatial index to enable "Find Nearby" queries later
reportSchema.index({ geospatial: "2dsphere" });
reportSchema.index({ timestamp: -1 });

// --- 3. Comments Schema ---
const commentSchema = new mongoose.Schema({
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    userId: { type: String, required: true },   // Link to User
    reportId: { type: String, required: true }  // Link to Report
});

// --- 4. Verifications Schema (The Voting Ledger) ---
const verificationSchema = new mongoose.Schema({
    reportId: { type: String, required: true },
    userId: { type: String, required: true },
    vote: { type: String, enum: ['verify', 'dispute'], required: true },
    timestamp: { type: Date, default: Date.now }
});

// Ensure a user can only vote once per report (Compound Unique Index)
verificationSchema.index({ reportId: 1, userId: 1 }, { unique: true });

// --- 5. Report Chain Schema (The Blockchain Replica) ---
const reportChainSchema = new mongoose.Schema({
    reportId: { type: String, required: true },
    hash: { type: String, required: true },
    previousHash: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
});

// --- 6. Moderation Logs Schema (Admin Actions) ---
const moderationLogSchema = new mongoose.Schema({
    action: { type: String, required: true },       // e.g., "soft_delete", "flag_user"
    performed_by: { type: String, required: true }, // Admin ID
    target_user: { type: String, default: null },   // ID of user being acted upon
    target_report: { type: String, default: null }, // ID of report being acted upon
    details: { type: Object },                      // Extra context
    timestamp: { type: Date, default: Date.now }
});

// --- 7. Audit Logs Schema (General Activity) ---
const auditLogSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    action: { type: String, required: true },       // e.g., "login", "upload_report"
    targetId: { type: String, default: null },
    details: { type: Object },
    timestamp: { type: Date, default: Date.now }
});

// --- Create Models ---
const User = mongoose.model("User", userSchema);
const Report = mongoose.model("Report", reportSchema);
const Comment = mongoose.model("Comment", commentSchema);
const Verification = mongoose.model("Verification", verificationSchema);
const ReportChain = mongoose.model("ReportChain", reportChainSchema);
const ModerationLog = mongoose.model("ModerationLog", moderationLogSchema);
const AuditLog = mongoose.model("AuditLog", auditLogSchema);

// --- Connection Logic ---
let isConnected = false;

async function connectToDatabase() {
    if (isConnected) {
        return;
    }

    const COSMOS_CONNECTION_STRING = process.env.COSMOS_DB_CONNECTION_STRING;

    if (!COSMOS_CONNECTION_STRING) {
        throw new Error("Cosmos DB connection string not found in environment variables");
    }

    try {
        await mongoose.connect(COSMOS_CONNECTION_STRING, {
            // Azure Cosmos DB for MongoDB recommendations
            serverSelectionTimeoutMS: 5000,
            autoIndex: true, // Builds indexes defined in schemas (like 2dsphere)
        });
        isConnected = true;
        console.log("--> Successfully connected to Azure Cosmos DB");
    } catch (err) {
        console.error("--> Error connecting to Cosmos DB:", err);
        throw err;
    }
}

// Export all models so they can be used in your Functions
module.exports = {
    connectToDatabase,
    User,
    Report,
    Comment,
    Verification,
    ReportChain,
    ModerationLog,
    AuditLog
};