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

// Health route
app.get('/health', (req, res) => {
  res.json({
    status: "OK",
    message: "EMLIFE Backend Running",
    timestamp: new Date()
  });
});

// Database test route
// Health route
app.get('/health', (req, res) => {
  res.json({
    status: "OK",
    message: "EMLIFE Backend Running",
    timestamp: new Date()
  });
});

// Database test route
app.get('/db-test', async (req, res) => {
  try {
    const response = await cloudant.getAllDbs();

    res.json({
      status: "Database Connected",
      databases: response.result
    });

  } catch (error) {
    res.status(500).json({
      status: "Database Error",
      error: error.message
    });
  }
});

// ===============================
// EMPLOYEES CRUD APIs
// ===============================

// Create Employee
app.post('/employees', async (req, res) => {
  try {
    const employeeDb = cloudant.database('employees');

    const response = await employeeDb.postDocument({
      document: req.body
    });

    res.json({
      status: "Employee Created",
      id: response.result.id
    });

  } catch (error) {
    res.status(500).json({
      status: "Error Creating Employee",
      error: error.message
    });
  }
});


// Get All Employees
app.get('/employees', async (req, res) => {
  try {
    const employeeDb = cloudant.database('employees');

    const response = await employeeDb.listDocuments({
      includeDocs: true
    });

    res.json({
      status: "Success",
      data: response.result.rows.map(row => row.doc)
    });

  } catch (error) {
    res.status(500).json({
      status: "Error Fetching Employees",
      error: error.message
    });
  }
});


// Get Employee By ID
app.get('/employees/:id', async (req, res) => {
  try {
    const employeeDb = cloudant.database('employees');

    const response = await employeeDb.getDocument({
      docId: req.params.id
    });

    res.json({
      status: "Success",
      data: response.result
    });

  } catch (error) {
    res.status(500).json({
      status: "Error Fetching Employee",
      error: error.message
    });
  }
});


// Update Employee
app.put('/employees/:id', async (req, res) => {
  try {
    const employeeDb = cloudant.database('employees');

    // First get existing document
    const existing = await employeeDb.getDocument({
      docId: req.params.id
    });

    const updatedDoc = {
      ...existing.result,
      ...req.body
    };

    const response = await employeeDb.putDocument({
      docId: req.params.id,
      document: updatedDoc
    });

    res.json({
      status: "Employee Updated",
      id: response.result.id
    });

  } catch (error) {
    res.status(500).json({
      status: "Error Updating Employee",
      error: error.message
    });
  }
});


// Delete Employee
app.delete('/employees/:id', async (req, res) => {
  try {
    const employeeDb = cloudant.database('employees');

    const existing = await employeeDb.getDocument({
      docId: req.params.id
    });

    const response = await employeeDb.deleteDocument({
      docId: req.params.id,
      rev: existing.result._rev
    });

    res.json({
      status: "Employee Deleted",
      id: response.result.id
    });

  } catch (error) {
    res.status(500).json({
      status: "Error Deleting Employee",
      error: error.message
    });
  }
});
