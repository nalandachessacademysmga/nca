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

// Define the route for the contact form
app.post('/contact', (req, res) => {
    //logger.info('Contact form POST request received.', { structuredData: true });
    
    const { name, email, phone, message } = req.body;
    //logger.info('Received data for contact form:', { name, email, phone, message });

    // Validate that required fields are present
    if (!name || !email || !message) {
        //logger.error('Bad Request: Missing required fields for contact form.');
        return res.status(400).send('Bad Request: Missing required fields');
    }

    const mailOptions = {
        from: `Nalanda Chess Academy <${process.env.GMAIL_EMAIL}>`,
        to: 'nalandachessacademysmga@gmail.com',
        subject: 'NCA - Contact Form',
        html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
            <p><strong>Message:</strong> ${message}</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            //logger.error('Error sending contact email:', error);
            return res.status(500).send(error.toString());
        }
        //logger.info('Contact email sent successfully!');
        return res.status(200).send('Message sent successfully!');
    });
});

// Define the NEW route for the admission enquiry form
app.post('/enquiry', (req, res) => {
    //logger.info('Admission enquiry POST request received.', { structuredData: true });
    
    const { name, email, phone, course } = req.body;
    //logger.info('Received data for enquiry form:', { name, email, phone, course });

    if (!name || !email || !phone || !course) {
        //logger.error('Bad Request: Missing required fields for enquiry form.');
        return res.status(400).send('Bad Request: Missing required fields');
    }

    const mailOptions = {
        from: `Nalanda Chess Academy <${process.env.GMAIL_EMAIL}>`,
        to: 'nalandachessacademysmga@gmail.com',
		subject: 'NCA - Admission Enquiry Form',
        html: `
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Interested Course:</strong> ${course}</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            //logger.error('Error sending enquiry email:', error);
            return res.status(500).send(error.toString());
        }
        //logger.info('Enquiry email sent:', { structuredData: true });
        return res.status(200).send('Enquiry sent successfully!');
    });
});

// Expose the Express app as a Cloud Function
exports.sendEmail = onRequest(app);
