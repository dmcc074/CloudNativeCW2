const { BlobServiceClient } = require("@azure/storage-blob");

// 1. Get the connection string from your environment variables
// (You will add "AzureWebJobsStorage" to your local.settings.json later)
const AZURE_STORAGE_CONNECTION_STRING = process.env.AzureWebJobsStorage;

async function uploadImageToBlob(fileBuffer, fileName, mimeType) {
    if (!AZURE_STORAGE_CONNECTION_STRING) {
        throw new Error("Azure Storage connection string not found");
    }

    // 2. Connect to the Blob Service
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);

    // 3. Get reference to the container created in Phase 1 (must match name exactly)
    const containerName = "media-uploads";
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // 4. Create a unique blob name (to prevent overwriting)
    const blobName = `${Date.now()}-${fileName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // 5. Upload data
    const uploadOptions = { blobHTTPHeaders: { blobContentType: mimeType } };
    await blockBlobClient.uploadData(fileBuffer, uploadOptions);

    // 6. Return the public URL
    // This URL will be saved to Cosmos DB in the next step
    return blockBlobClient.url;
}

module.exports = { uploadImageToBlob };