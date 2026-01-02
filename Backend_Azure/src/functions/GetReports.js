const { app } = require('@azure/functions');
const { connectToDatabase, Report } = require('../database');

app.http('GetReports', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log('GetReports function triggered.');

        try {
            await connectToDatabase();

            let query = {};

            // v4 Change: Query parameters are accessed via request.query.get()
            const status = request.query.get('status');
            const lat = request.query.get('lat');
            const long = request.query.get('long');
            const radius = request.query.get('radius');

            if (status) {
                query.status = status;
            }

            if (lat && long) {
                const radiusInMeters = parseInt(radius) || 5000;
                query.geospatial = {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [parseFloat(long), parseFloat(lat)]
                        },
                        $maxDistance: radiusInMeters
                    }
                };
            }

            const reports = await Report.find(query).sort({ timestamp: -1 });

            return { status: 200, jsonBody: reports };

        } catch (error) {
            context.log(error);
            return { status: 500, body: error.message };
        }
    }
});