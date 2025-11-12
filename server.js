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

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

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
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "1d" });
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

/* ================= AUTH ROUTES ================= */

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const { data: existing } = await supabase.from("users").select("*").eq("email", email).single();
    if (existing) return res.status(400).json({ error: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const { data, error } = await supabase.from("users").insert([{ name, email, password: hashed, role }]).select().single();
    if (error) throw error;

    const token = generateToken(data);
    res.json({ user: data, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const { data: user, error } = await supabase.from("users").select("*").eq("email", email).single();
    if (error || !user) return res.status(400).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = generateToken(user);
    res.json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= APPOINTMENTS ================= */

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
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .is("doctor_name", null);
    if (error) throw error;
    res.json({ queue: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign physician / finalize triage
app.post("/api/appointments/triage/:id", auth, async (req, res) => {
  try {
    const { assignedSpecialty, assignedPhysicianId, datetime, notes } = req.body;
    const id = req.params.id;

    const { error } = await supabase
      .from("appointments")
      .update({
        doctor_name: assignedPhysicianId || "Unassigned",
        specialty: assignedSpecialty,
        appointment_date: datetime,
        notes,
        status: "Scheduled",
      })
      .eq("id", id);

    if (error) throw error;
    res.json({ message: "Triage completed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= BOOK APPOINTMENT ================= */
app.post("/book-appointment", async (req, res) => {
  try {
    const { patientName, patientEmail, doctorName, appointmentDate, phone } = req.body;

    const { error } = await supabase.from("appointments").insert([
      {
        patient_name: patientName,
        patient_email: patientEmail,
        doctor_name: doctorName,
        appointment_date: appointmentDate,
        status: "Pending",
      },
    ]);
    if (error) throw error;

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

// Serve index.html for root route
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

/* ================= SERVER START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${__dirname}`);
});


