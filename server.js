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
    const employee = await cloudant.getDocument({
      db: 'employees',
      docId: req.params.id
    });

    res.json(employee.result);

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
    const id = req.params.id;

    // 1️⃣ Get existing document
    const existing = await cloudant.getDocument({
      db: 'employees',
      docId: id
    });

    const currentDoc = existing.result;

    // 2️⃣ Update fields
    const updatedDoc = {
      ...currentDoc,
      ...req.body
    };

    // 3️⃣ Save updated document
    const response = await cloudant.putDocument({
      db: 'employees',
      docId: id,
      document: updatedDoc
    });

    res.json({
      status: "Employee Updated",
      result: response.result
    });

  } catch (error) {
    res.status(500).json({
      status: "Error Updating Employee",
      error: error.message
    });
  }
});
// Update Employee
app.put('/employees/:id', async (req, res) => {
  try {
    const id = req.params.id;

    // 1️⃣ Get existing document
    const existing = await cloudant.getDocument({
      db: 'employees',
      docId: id
    });

    const currentDoc = existing.result;

    // 2️⃣ Update fields
    const updatedDoc = {
      ...currentDoc,
      ...req.body
    };

    // 3️⃣ Save updated document
    const response = await cloudant.putDocument({
      db: 'employees',
      docId: id,
      document: updatedDoc
    });

    res.json({
      status: "Employee Updated",
      result: response.result
    });

  } catch (error) {
    res.status(500).json({
      status: "Error Updating Employee",
      error: error.message
    });
  }
});
