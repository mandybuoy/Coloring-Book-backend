import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/drive"];
const KEYFILEPATH = "./service-account.json"; // Path to your service account credentials

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});
const drive = google.drive({ version: "v3", auth: auth });

async function shareFolderWithUser(folderId, userEmail) {
  try {
    const response = await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        type: "user",
        role: "reader",
        emailAddress: userEmail,
      },
      fields: "id",
    });
    console.log("Folder shared with permission ID:", response.data.id);
    return response.data;
  } catch (error) {
    console.error("Error sharing folder:", error);
    throw error;
  }
}

async function testDriveAccess() {
  try {
    const response = await drive.files.list({
      pageSize: 10,
      fields: "files(id, name)",
    });
    console.log("Files accessible to service account:", response.data.files);
    return response.data.files;
  } catch (error) {
    console.error("Error testing Drive access:", error);
    throw error;
  }
}

// testDriveAccess();

export { shareFolderWithUser, testDriveAccess };
