const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
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
    const { name, email, reason } = req.body;
    
    // Save to JSON file
    const consultation = {
        id: Date.now(),
        name,
        email,
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
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER || 'your-email@gmail.com',
                pass: process.env.EMAIL_PASSWORD || 'your-app-password'
            }
        });
        
        await transporter.sendMail({
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: process.env.ADMIN_EMAIL || 'admin@purematch.org',
            subject: 'New Consultation Request',
            html: `<h3>New Consultation Request</h3>
                   <p><strong>Name:</strong> ${name}</p>
                   <p><strong>Email:</strong> ${email}</p>
                   <p><strong>Reason:</strong> ${reason}</p>`
        });
    } catch (error) {
        console.log('Email not configured:', error.message);
    }
    
    res.json({ success: true, message: 'Consultation request submitted successfully!' });
});

app.listen(PORT, () => {
    console.log(`PureMatch.org running on http://localhost:${PORT}`);
});// JavaScript Document