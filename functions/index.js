const functions = require("firebase-functions");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const nodemailer = require('nodemailer');
const cors = require('cors');
const express = require('express');

// Set global options for function deployment
setGlobalOptions({ maxInstances: 10 });

// Configure your email service provider using process.env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD
    }
});

// Create an Express app instance
const app = express();

// Use CORS middleware to enable cross-origin requests
app.use(cors({ origin: true }));

// Parse incoming request bodies as JSON
app.use(express.json());

// Define the route for your contact form submission
app.post('/', (req, res) => {
    const { name, email, phone, message } = req.body;

    // Validate that required fields are present
    if (!name || !email || !message) {
        return res.status(400).send('Bad Request: Missing required fields (name, email, message)');
    }

    const mailOptions = {
        from: `Nalanda Chess Academy <${process.env.GMAIL_EMAIL}>`,
        to: 'nalandachessacademysmga@gmail.com',
        subject: 'New Message from Contact Form',
        html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Message:</strong> ${message}</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.error('Error sending email:', error);
            return res.status(500).send(error.toString());
        }
        logger.info('Email sent:', { structuredData: true });
        return res.status(200).send('Message sent successfully!');
    });
});

// Expose the Express app as a Cloud Function
exports.sendEmail = onRequest(app);