// functions/src/sendEmail.ts
import * as functions from 'firebase-functions';
import * as nodemailer from 'nodemailer';

// 1️⃣  Configure the email transport using Gmail or any SMTP server.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,       // gmail address
    pass: functions.config().gmail.password,    // gmail app‑password
  },
});

// 2️⃣  Export an HTTPS function that receives a POST with JSON body.
export const sendEmail = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { name, email, phone, message } = req.body;

  // Basic validation (you can extend this as needed)
  if (!name || !email || !message) {
    res.status(400).send('Missing required fields');
    return;
  }

  // 3️⃣  Build the email
  const mailOptions = {
    from: `${name} <${email}>`,      // show sender’s name and email
    to: 'nalandachessacademysmga@gmail.com',
    subject: `New contact from ${name}`,
    text: `
You have a new message from your website contact form.

Name: ${name}
Email: ${email}
Phone: ${phone || 'N/A'}

Message:
${message}
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send('✅ Email sent');
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).send('❌ Failed to send email');
  }
});
