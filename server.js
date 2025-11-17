import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = 8080;
const app = express();

// CORS and JSON parsing - must be first
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} | originalUrl: ${req.originalUrl}`);
  next();
});

/* ================= SUPABASE CONFIG ================= */
const SUPABASE_URL = "https://gjomgbwbqfbngozolede.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqb21nYndicWZibmdvem9sZWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1MTc0MzEsImV4cCI6MjA3NjA5MzQzMX0.KIeCSgZ5-E2x_gV4Scv7_vFFmMx-_vudvlyN4CW4hes";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/* ================= EMAIL & TWILIO ================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mutheecollins929@gmail.com",
    pass: "collinswanjiru6885", // app password
  },
});

const TWILIO_SID = "AC50d0f0cc914991230f59131e6f4db02d";
const TWILIO_AUTH = "7a0513e134c33fad5c247f2881d672b2";
const TWILIO_PHONE = "0748927634";
const twilioClient = twilio(TWILIO_SID, TWILIO_AUTH);

const JWT_SECRET = "super_secret_key";

/* ========== Utility Functions ========== */
function generateToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: "1d" });
}

async function sendEmail(to, subject, message) {
  try {
    await transporter.sendMail({ from: "mutheecollins929@gmail.com", to, subject, text: message });
    console.log("✅ Email sent to", to);
  } catch (err) {
    console.error("❌ Email error:", err.message);
  }
}

/* ========== Auth Middleware ========== */
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Missing token" });

  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* ================= API ROUTES - DEFINED FIRST ================= */

// Handle CORS preflight
app.use((req, res, next) => {
  if (req.method === "OPTIONS" && req.path.startsWith("/api/")) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.sendStatus(200);
  }
  next();
});

// Test route
app.get("/api/test", (req, res) => {
  console.log("✅ Test route hit!");
  res.json({ message: "API routes are working!" });
});

// Register route
app.post("/api/auth/register", async (req, res) => {
  console.log("✅✅✅ Register route HIT! Body:", JSON.stringify(req.body, null, 2));
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Check if user exists
    const { data: existingUsers, error: checkError } = await supabase.from("users").select("*").eq("email", email).limit(1);
    if (checkError) throw checkError;
    if (existingUsers && existingUsers.length > 0) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from("users").insert([{ name, email, password: hashed, role: role || 'patient' }]).select().single();
    if (error) throw error;

    const token = generateToken(data);
    console.log("✅ Registration successful for:", email);
    res.json({ user: data, token });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Login route
app.post("/api/auth/login", async (req, res) => {
  console.log("✅ Login route hit!");
  try {
    const { email, password } = req.body;
    const { data: users, error } = await supabase.from("users").select("*").eq("email", email).limit(1);
    if (error) throw error;
    const user = users && users.length > 0 ? users[0] : null;
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create new appointment
app.post("/api/appointments", async (req, res) => {
  console.log("✅✅✅ POST /api/appointments route HIT! Body:", JSON.stringify(req.body, null, 2));
  try {
    const { patientName, patientEmail, doctorName, appointmentDate, phone, reason } = req.body;

    if (!patientName || !patientEmail || !doctorName || !appointmentDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Map to database column names
    // Note: If doctor_name column doesn't exist, doctor info will be stored in reason field
    const appointmentData = {
      patient_name: patientName,
      patient_email: patientEmail,
      appointment_date: appointmentDate,
      phone: phone || null,
      reason: reason || `Appointment with ${doctorName}`,
      status: "Pending",
    };
    
    // Try to add doctor_name if column exists (will be handled in error catch if it doesn't exist)
    const { data, error } = await supabase
      .from("appointments")
      .insert([{ ...appointmentData, doctor_name: doctorName }])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase error:", error);
      
      // If doctor_name column doesn't exist, insert without it (doctor info is already in reason field)
      if (error.message && (error.message.includes("doctor_name") || error.message.includes("column") && error.message.includes("doctor"))) {
        console.log("⚠️ doctor_name column not found, inserting without it...");
        const { data: retryData, error: retryError } = await supabase
          .from("appointments")
          .insert([appointmentData]) // Without doctor_name
          .select()
          .single();
          
        if (retryError) {
          console.error("❌ Retry error:", retryError);
          throw new Error(`Database error: Please ensure your 'appointments' table has columns: patient_name, patient_email, appointment_date, phone, reason, status. Error: ${retryError.message}`);
        }
        // Success without doctor_name column
        return res.json({ message: "Appointment booked successfully", appointment: retryData });
      }
      throw error;
    }

    // Send confirmation email
    try {
      await sendEmail(
        patientEmail,
        "Appointment Confirmation",
        `Dear ${patientName}, your appointment with ${doctorName} on ${new Date(appointmentDate).toLocaleString()} has been received. We will confirm shortly.`
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the request if email fails
    }

    res.json({ message: "Appointment booked successfully", appointment: data });
  } catch (err) {
    console.error("❌ Appointment booking error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's appointments
app.get("/api/appointments/mine", auth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_email", req.user.email);
    if (error) throw error;
    res.json({ list: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Triage queue (for physicians)
app.get("/api/appointments/triage-queue", auth, async (req, res) => {
  try {
    // Try to filter by doctor_name, if column doesn't exist, get all pending appointments
    let query = supabase.from("appointments").select("*");
    
    // Try filtering by doctor_name if column exists
    try {
      const { data, error } = await query.is("doctor_name", null);
      if (!error) {
        return res.json({ queue: data || [] });
      }
      // If error contains doctor_name, column doesn't exist
      if (error.message && error.message.includes("doctor_name")) {
        // Get all pending appointments instead
        const { data: allData, error: allError } = await supabase
          .from("appointments")
          .select("*")
          .eq("status", "Pending");
        if (allError) throw allError;
        return res.json({ queue: allData || [] });
      }
      throw error;
    } catch (err) {
      // If doctor_name column doesn't exist, get all pending appointments
      if (err.message && err.message.includes("doctor_name")) {
        const { data, error } = await supabase
          .from("appointments")
          .select("*")
          .eq("status", "Pending");
        if (error) throw error;
        return res.json({ queue: data || [] });
      }
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign physician / finalize triage
app.post("/api/appointments/triage/:id", auth, async (req, res) => {
  try {
    const { assignedSpecialty, assignedPhysicianId, datetime, notes } = req.body;
    const id = req.params.id;

    const updateData = {
      specialty: assignedSpecialty,
      appointment_date: datetime,
      notes,
      status: "Scheduled",
    };
    
    // Try to add doctor_name if column exists
    if (assignedPhysicianId) {
      updateData.doctor_name = assignedPhysicianId;
    }

    const { error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", id);

    if (error) {
      // If doctor_name column doesn't exist, update without it
      if (error.message && (error.message.includes("doctor_name") || error.message.includes("column") && error.message.includes("doctor"))) {
        delete updateData.doctor_name;
        // Add doctor info to reason or notes if doctor_name column doesn't exist
        if (assignedPhysicianId && updateData.notes) {
          updateData.notes = `Assigned to: ${assignedPhysicianId}\n${updateData.notes}`;
        } else if (assignedPhysicianId) {
          updateData.notes = `Assigned to: ${assignedPhysicianId}`;
        }
        const { error: retryError } = await supabase
          .from("appointments")
          .update(updateData)
          .eq("id", id);
        if (retryError) throw retryError;
        return res.json({ message: "Triage completed" });
      }
      throw error;
    }
    
    res.json({ message: "Triage completed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= BOOK APPOINTMENT ================= */
app.post("/book-appointment", async (req, res) => {
  try {
    const { patientName, patientEmail, doctorName, appointmentDate, phone } = req.body;

    const appointmentData = {
      patient_name: patientName,
      patient_email: patientEmail,
      appointment_date: appointmentDate,
      reason: `Appointment with ${doctorName}`,
      status: "Pending",
    };
    
    if (phone) appointmentData.phone = phone;

    // Try with doctor_name, fallback without it if column doesn't exist
    const { error } = await supabase.from("appointments").insert([{ ...appointmentData, doctor_name: doctorName }]);
    
    if (error && (error.message.includes("doctor_name") || (error.message.includes("column") && error.message.includes("doctor")))) {
      // Retry without doctor_name (doctor info is in reason field)
      const { error: retryError } = await supabase.from("appointments").insert([appointmentData]);
      if (retryError) throw retryError;
    } else if (error) {
      throw error;
    }

    await sendEmail(
      patientEmail,
      "Appointment Confirmation",
      `Dear ${patientName}, your appointment with Dr. ${doctorName} on ${appointmentDate} has been received.`
    );

    res.json({ message: "Appointment booked successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ================= AVAILABILITY ================= */
app.get("/api/availability/:specialty", async (req, res) => {
  try {
    const { specialty } = req.params;
    
    // Generate mock availability slots for the next 7 days
    // In a real app, this would query the database for actual doctor availability
    const slots = [];
    const now = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      
      // Generate 4 time slots per day (9 AM, 11 AM, 2 PM, 4 PM)
      const timeSlots = ['09:00', '11:00', '14:00', '16:00'];
      
      timeSlots.forEach(time => {
        const slotDateTime = new Date(date);
        const [hours, minutes] = time.split(':');
        slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Only add future slots
        if (slotDateTime > now) {
          slots.push({
            datetime: slotDateTime.toISOString(),
            specialty: specialty,
            available: true
          });
        }
      });
    }
    
    res.json({ slots });
  } catch (err) {
    console.error("❌ Availability error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ================= PHYSICIAN HELP ================= */
app.post("/physician-help", async (req, res) => {
  try {
    const { patientName, email, symptoms, urgency, specialist } = req.body;
    
    // Log the recommendation (in a real app, this would be saved to database)
    console.log(`Recommendation for ${patientName} (${email}): ${specialist}`);
    console.log(`Symptoms: ${symptoms}, Urgency: ${urgency}`);
    
    res.json({ 
      message: "Recommendation received",
      specialist,
      patientName 
    });
  } catch (err) {
    console.error("❌ Physician help error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Serve index.html for root route
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// Serve static files (HTML, CSS, JS) - AFTER all API routes
app.use(express.static(__dirname));

// 404 handler - must be last
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    console.log(`❌ API route not found: ${req.method} ${req.originalUrl}`);
    console.log(`   Path: ${req.path}`);
    console.log(`   Original URL: ${req.originalUrl}`);
    console.log(`   Available routes:`);
    console.log(`     POST /api/auth/register`);
    console.log(`     POST /api/auth/login`);
    console.log(`     POST /api/appointments`);
    console.log(`     GET  /api/appointments/mine`);
    console.log(`     GET  /api/appointments/triage-queue`);
    console.log(`     POST /api/appointments/triage/:id`);
    console.log(`     GET  /api/availability/:specialty`);
    console.log(`   This means the route handler was never called`);
    return res.status(404).json({ 
      error: "Route not found",
      message: `The requested API endpoint ${req.method} ${req.originalUrl} does not exist. Please check the route path.`
    });
  }
  // For non-API routes, serve index.html (SPA fallback)
  res.status(404).sendFile(join(__dirname, "index.html"));
});

/* ================= SERVER START ================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${__dirname}`);
  console.log(`✅ API routes registered:`);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   POST /api/appointments`);
  console.log(`   GET  /api/appointments/mine`);
  console.log(`   GET  /api/appointments/triage-queue`);
  console.log(`   POST /api/appointments/triage/:id`);
  console.log(`   GET  /api/availability/:specialty`);
  console.log(`   POST /book-appointment`);
  console.log(`   POST /physician-help`);
  console.log(`   GET  /api/test`);
  console.log(`\n🔍 Ready to receive requests...\n`);
});

