// controllers/employeeController.js
import { connection } from "../config/db.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";  // ← CORRECTED THIS LINE
import dotenv from "dotenv";

dotenv.config();

// Standalone email function specifically for employee registration
const sendEmployeeCredentialsEmail = async (email, firstName, username, password) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "vergarajoshuamiguel@gmail.com",
        pass: process.env.EMAIL_PASS || "ygou vurm zkjm znwd",
      },
    });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Your Account Details</title>
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 30px;
            color: #222;
          }
          .container {
            max-width: 480px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.08);
            overflow: hidden;
          }
          .header {
            background-color: #111;
            color: white;
            text-align: center;
            padding: 20px 10px;
            font-size: 1.2rem;
            font-weight: 600;
            letter-spacing: 0.5px;
          }
          .content {
            padding: 25px;
            line-height: 1.6;
            text-align: center;
          }
          .credentials-box {
            background: #f2f2f2;
            border: 1px solid #ddd;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
          }
          .label {
            font-weight: 600;
            color: #555;
          }
          .value {
            font-size: 1.1rem;
            color: #000;
          }
          .footer {
            background: #fafafa;
            text-align: center;
            padding: 15px;
            font-size: 0.8rem;
            color: #888;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            Sentrix Account Credentials
          </div>
          <div class="content">
            <p>Hello ${firstName},</p>
            <p>Your temporary login credentials for <strong>Sentrix</strong> have been created:</p>

            <div class="credentials-box">
              <div><span class="label">Username:</span> <span class="value">${username}</span></div>
              <div><span class="label">Password:</span> <span class="value">${password}</span></div>
            </div>

            <p>Please change your password upon first login to keep your account secure.</p>
            <p>If you did not request this, please ignore this email.</p>
          </div>
          <div class="footer">
            © 2024 Sentrix. All rights reserved.
          </div>  
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: '"Sentrix - Your Health Service Management Provider" <vergarajoshuamiguel@gmail.com>',
      to: email,
      subject: "Your Sentrix Account Details",
      html: html,
    });

    console.log("✅ Employee credentials email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending employee email:", error);
    throw error;
  }
};

export const addEmployeeController = (req, res) => {
  const {
    first_name,
    middle_name,
    last_name,
    email,
    phone,
    address,
    sex,
    position,
    profile_picture,
  } = req.body;

  const username = `${last_name}-${first_name}-${middle_name}`.toLowerCase();
  const password = Math.floor(Math.random() * 10000000).toString();
  const saltRounds = 10;

  let imageBuffer = null;
  if (profile_picture) {
    try {
      const base64Data = profile_picture.replace(/^data:image\/\w+;base64,/, "");
      imageBuffer = Buffer.from(base64Data, "base64");
    } catch (err) {
      console.error("Error processing profile picture:", err);
      return res.status(400).json({ message: "Invalid image format" });
    }
  }

  bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
    if (err) {
      console.error("Hashing error:", err);
      return res.status(500).send("Error hashing password");
    }

    const query = `CALL RegisterEmployee(?,?,?,?,?,?,?,?,?,?)`;

    connection.query(
      query,
      [
        first_name,
        middle_name,
        last_name,
        email,
        phone,
        address,
        sex,
        username,
        hashedPassword,
        position,
      ],
      async (err, rows) => {
        if (err) {
          console.error("Query error:", err.message);
          return res.status(500).json({
            message: "Database error",
            error: err.message,
          });
        }

        try {
          // ✉️ Send email with the standalone function
          await sendEmployeeCredentialsEmail(
            email,
            first_name,
            username,
            password
          );
        } catch (emailErr) {
          console.error("Email sending failed:", emailErr);
          // Continue even if email fails - don't fail the whole registration
        }

        res.status(200).json({
          message: "Employee successfully registered",
          username,
          password,
        });
      }
    );
  });
};

