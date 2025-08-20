const functions = require("firebase-functions");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const nodemailer = require('nodemailer');
const cors = require('cors');
const express = require('express');

// Set global options for function deployment
setGlobalOptions({ maxInstances: 10 });

// Configure your email service provider
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: functions.config().gmail.email,
        pass: functions.config().gmail.password
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
        from: `Nalanda Chess Academy <${functions.config().gmail.email}>`,
        to: 'nalandachessacademysmga@gmail.com', // Replace with the recipient's email
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