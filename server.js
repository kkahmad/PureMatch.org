const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle consultation form submission
app.post('/submit-consultation', async (req, res) => {
    const { name, email, reason, phone } = req.body;
    
    // Save to JSON file
    const consultation = {
        id: Date.now(),
        name,
        email,
        phone,
        reason,
        date: new Date().toISOString()
    };
    
    let consultations = [];
    if (fs.existsSync('consultations.json')) {
        const data = fs.readFileSync('consultations.json');
        consultations = JSON.parse(data);
    }
    consultations.push(consultation);
    fs.writeFileSync('consultations.json', JSON.stringify(consultations, null, 2));
    
    // Send email notification (configure with your email)
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: process.env.SMTP_PORT || 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER || 'info@purematch.org',
                pass: process.env.EMAIL_PASSWORD || 'Rashid@Purematch123'
            }
        });
        
        const emailHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }
                    .header { background: linear-gradient(135deg, #D97A8E 0%, #6BA3D6 100%); padding: 30px; text-align: center; color: white; }
                    .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
                    .header p { margin: 5px 0 0 0; font-size: 14px; opacity: 0.9; }
                    .content { padding: 30px; }
                    .info-section { margin-bottom: 25px; }
                    .info-item { display: flex; margin-bottom: 16px; padding: 12px; background-color: #f9f9f9; border-left: 4px solid #D97A8E; border-radius: 4px; }
                    .info-label { font-weight: 600; color: #D97A8E; min-width: 100px; }
                    .info-value { color: #333; margin-left: 10px; }
                    .divider { height: 1px; background-color: #e0e0e0; margin: 25px 0; }
                    .footer { background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px; }
                    .cta-button { display: inline-block; margin-top: 20px; padding: 12px 30px; background: linear-gradient(135deg, #D97A8E 0%, #6BA3D6 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: 600; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 New Consultation Request</h1>
                        <p>Someone has filled out the Quick Contact form</p>
                    </div>
                    <div class="content">
                        <div class="info-section">
                            <div class="info-item">
                                <span class="info-label">👤 Name:</span>
                                <span class="info-value">${name}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">📧 Email:</span>
                                <span class="info-value"><a href="mailto:${email}" style="color: #D97A8E; text-decoration: none;">${email}</a></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">📱 Phone:</span>
                                <span class="info-value"><a href="tel:${phone}" style="color: #D97A8E; text-decoration: none;">${phone}</a></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">🎯 Interested In:</span>
                                <span class="info-value"><strong>${reason}</strong></span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">📅 Date:</span>
                                <span class="info-value">${new Date().toLocaleString()}</span>
                            </div>
                        </div>
                        <div class="divider"></div>
                        <p style="color: #666; font-size: 14px;">This person is interested in learning more about our services. Please reach out to them within 24 hours to provide a personalized consultation.</p>
                    </div>
                    <div class="footer">
                        <p>© 2026 PureMatch.org | Building Beautiful Connections</p>
                        <p>This is an automated message from your consultation form.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: 'info@purematch.org',
            subject: `New Consultation Request - ${name}`,
            html: emailHTML
        });
    } catch (error) {
        console.log('Email not configured:', error.message);
    }
    
    res.json({ success: true, message: 'Consultation request submitted successfully!' });
});

// API endpoint to get all consultations
app.get('/api/consultations', (req, res) => {
    try {
        if (fs.existsSync('consultations.json')) {
            const data = fs.readFileSync('consultations.json');
            const consultations = JSON.parse(data);
            res.json({ consultations });
        } else {
            res.json({ consultations: [] });
        }
    } catch (error) {
        console.error('Error reading consultations:', error);
        res.json({ consultations: [] });
    }
});

app.listen(PORT, () => {
    console.log(`PureMatch.org running on http://localhost:${PORT}`);
});// JavaScript Document