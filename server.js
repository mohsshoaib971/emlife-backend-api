require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { CloudantV1 } = require("@ibm-cloud/cloudant");
const { IamAuthenticator } = require("ibm-cloud-sdk-core");

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;

// Cloudant connection
const cloudant = CloudantV1.newInstance({
  authenticator: new IamAuthenticator({
    apikey: process.env.CLOUDANT_APIKEY,
  }),
  serviceUrl: process.env.CLOUDANT_URL,
});

// Test route
app.get("/", (req, res) => {
  res.json({ message: "EMLife Backend API Running 🚀" });
});

// Get all employees
app.get("/employees", async (req, res) => {
  try {
    const response = await cloudant.postAllDocs({
      db: "employees",
      includeDocs: true,
    });

    const employees = response.result.rows.map(row => row.doc);
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
