require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { CloudantV1 } = require("@ibm-cloud/cloudant");
const { IamAuthenticator } = require("ibm-cloud-sdk-core");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT;

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
// Register User
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      role: "admin",
      created_at: new Date()
    };

    const response = await cloudant.postDocument({
      db: "employees",
      document: newUser
    });

    res.json({ message: "User registered", id: response.result.id });
  } catch (error) {
    res.status(500).json({ message: "Registration error", error: error.message });
  }
});
// Login User
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const response = await cloudant.postFind({
      db: "employees",
      selector: { email },
    });

    if (!response.result.docs.length) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = response.result.docs[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Login error",
      error: error.message,
    });
  }
});
// JWT Verification Middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
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
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
