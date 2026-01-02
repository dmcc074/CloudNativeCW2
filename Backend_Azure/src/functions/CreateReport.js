const { app } = require('@azure/functions');
const crypto = require('crypto');
const { uploadImageToBlob } = require('../storage');
const { connectToDatabase, Report } = require('../database');

app.http('CreateReport', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('CreateReport function triggered.');

        try {
            await connectToDatabase();

            // v4 Change: You must await request.json() to get the body
            const body = await request.json();
            const { title, creatorId, lat, long, fileData, fileName } = body;

            if (!title || !creatorId || !fileData || !lat || !long) {
                return { status: 400, body: "Missing required fields." };
            }

            const fileBuffer = Buffer.from(fileData, 'base64');

            // Hashing (Blockchain logic)
            const hashSum = crypto.createHash('sha256');
            hashSum.update(fileBuffer);
            const fileHash = hashSum.digest('hex');

            // Upload to Blob
            const uploadedUrl = await uploadImageToBlob(fileBuffer, fileName, 'image/jpeg');

            // Blockchain Linking
            const lastReport = await Report.findOne().sort({ timestamp: -1 });
            const previousHash = lastReport ? lastReport.hash : "GENESIS_BLOCK";

            const newReport = new Report({
                title,
                creatorId,
                mediaUrl: uploadedUrl,
                geospatial: {
                    type: 'Point',
                    coordinates: [parseFloat(long), parseFloat(lat)]
                },
                hash: fileHash,
                previousHash,
                status: "Under Review",
                aiConfidenceScore: 0.85
            });

            const savedReport = await newReport.save();

            return { status: 201, jsonBody: savedReport };

        } catch (error) {
            context.log(error);
            return { status: 500, body: "Internal Server Error: " + error.message };
        }
    }
});