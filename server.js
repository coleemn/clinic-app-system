/*
 * ===================================================================
 * CLINIC APP SYSTEM - SERVER
 * ===================================================================
 * 
 * NOTE: This application now uses Supabase as the backend.
 * Most API operations (CRUD, auth) are handled directly by the 
 * Supabase client in main.js on the frontend.
 * 
 * This server file is kept for:
 * - Email notifications (nodemailer) - optional
 * - SMS notifications (Twilio) - optional
 * - Serving static files if needed - optional
 * 
 * To run a fully Supabase-based app, you can:
 * 1. Remove this server entirely and serve static files via:
 *    - Vercel, Netlify, GitHub Pages, or any static hosting
 *    - Supabase Storage for assets
 * 
 * 2. Or use Supabase Edge Functions for email/SMS:
 *    - Move email/SMS logic to Supabase Edge Functions
 *    - Use database triggers to call Edge Functions
 * 
 * 3. Keep this server only for email/SMS if needed
 * 
 * ===================================================================
 */

import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import twilio from "twilio";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 8080;
const app = express();

// CORS and JSON parsing - must be first
app.use(cors());
app.use(express.json());

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

/* ================= SUPABASE CONFIG ================= */
// Supabase is now primarily used on the frontend (main.js)
// This is kept here only if you need server-side Supabase operations
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

/* ========== Utility Functions ========== */
async function sendEmail(to, subject, message) {
  try {
    await transporter.sendMail({ from: "mutheecollins929@gmail.com", to, subject, text: message });
    console.log("✅ Email sent to", to);
  } catch (err) {
    console.error("❌ Email error:", err.message);
  }
}

/* ================= OPTIONAL API ROUTES ================= */
// These routes are optional. The app now uses Supabase directly from the frontend.
// Keep these only if you need server-side email/SMS notifications.

// Test route
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "Server is running. App uses Supabase as backend.",
    note: "Most operations are handled by Supabase client in main.js"
  });
});

// Optional: Email notification webhook (can be called by Supabase Edge Function)
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, subject, message } = req.body;
    if (!to || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    await sendEmail(to, subject, message);
    res.json({ message: "Email sent successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===================================================================
 * NOTE: All appointment CRUD operations are now handled by Supabase 
 * directly from the frontend (main.js). The following routes are 
 * deprecated but kept for reference/backward compatibility.
 * 
 * To enable email notifications for appointments, you can:
 * 1. Use Supabase Database Webhooks to trigger Edge Functions
 * 2. Or use Supabase Realtime subscriptions to detect new appointments
 * 3. Or call the /api/send-email endpoint from a Supabase Edge Function
 * ===================================================================
 */

/* ================= STATIC FILES & ROUTING ================= */
// Serve static files (HTML, CSS, JS) - useful for local development
app.use(express.static(__dirname));

// Serve index.html for root route
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

// 404 handler - must be last
app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ 
      error: "Route not found",
      message: "This app uses Supabase as backend. Most API routes are handled by Supabase client in main.js"
    });
  }
  // For non-API routes, serve index.html (SPA fallback)
  res.status(404).sendFile(join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Clinic App Server running on http://localhost:${PORT}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📌 BACKEND: Supabase (configured in main.js)`);
  console.log(`📁 Static files served from: ${__dirname}`);
  console.log(`\n✅ Available routes:`);
  console.log(`   GET  /api/test - Server test endpoint`);
  console.log(`   POST /api/send-email - Optional email webhook`);
  console.log(`   *    All other routes - Handled by Supabase client`);
  console.log(`\n💡 NOTE: Most operations (auth, appointments) are now`);
  console.log(`   handled directly by Supabase from the frontend.`);
  console.log(`   This server is optional and mainly for static file serving.`);
  console.log(`\n🔍 Ready to receive requests...\n`);
});

