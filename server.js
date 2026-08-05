const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

try {
    require('dotenv').config();
} catch (error) {
    // dotenv is optional for local development
}

const { readJsonFile, writeJsonFile, hashPassword, verifyPassword, generateUsername } = require('./auth');
const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const CONSULTATIONS_FILE = path.join(__dirname, 'consultations.json');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@purematch.org';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const authTokens = new Map();

function loadUsers() {
    return readJsonFile(USERS_FILE, []);
}

function saveUsers(users) {
    writeJsonFile(USERS_FILE, users);
}

function sanitizeUser(user) {
    const { password, ...safeUser } = user;
    return safeUser;
}

function getAuthUser(req) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
        return null;
    }

    return authTokens.get(token) || null;
}

function createToken(user) {
    const token = crypto.randomBytes(24).toString('hex');
    authTokens.set(token, user);
    return token;
}

function createAdminToken() {
    const token = crypto.randomBytes(24).toString('hex');
    authTokens.set(token, {
        id: -1,
        name: 'PureMatch Admin',
        email: ADMIN_EMAIL,
        username: 'purematch-admin',
        admin: true,
        verified: true
    });
    return token;
}

function getUserByEmail(users, email) {
    return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Serve pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-profile.html'));
});

app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signin.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Authentication routes
app.post('/api/auth/signup', (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide your name, email, and password.' });
    }

    const users = loadUsers();
    if (getUserByEmail(users, email)) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const newUser = {
        id: Date.now(),
        name: name.trim(),
        username: generateUsername(name, email),
        email: email.toLowerCase().trim(),
        password: hashPassword(password),
        profile: {},
        createdAt: new Date().toISOString(),
        verified: true
    };

    users.push(newUser);
    saveUsers(users);

    const token = createToken(newUser);
    res.json({
        success: true,
        message: 'Account created successfully.',
        token,
        user: sanitizeUser(newUser)
    });
});

app.post('/api/auth/signin', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide your email and password.' });
    }

    const users = loadUsers();
    const user = getUserByEmail(users, email);

    if (!user || !verifyPassword(password, user.password)) {
        return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = createToken(user);
    res.json({
        success: true,
        message: 'Signed in successfully.',
        token,
        user: sanitizeUser(user)
    });
});

app.get('/api/auth/me', (req, res) => {
    const user = getAuthUser(req);

    if (!user) {
        return res.status(401).json({ success: false, message: 'Please sign in to continue.' });
    }

    const users = loadUsers();
    const currentUser = users.find((item) => item.id === user.id);

    if (!currentUser) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user: sanitizeUser(currentUser) });
});

app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Please provide your email and password.' });
    }

    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
    }

    const token = createAdminToken();
    res.json({
        success: true,
        message: 'Admin signed in successfully.',
        token,
        user: {
            id: -1,
            name: 'PureMatch Admin',
            email: ADMIN_EMAIL,
            username: 'purematch-admin',
            admin: true,
            verified: true
        }
    });
});

app.get('/api/admin/me', (req, res) => {
    const user = getAuthUser(req);

    if (!user || !user.admin) {
        return res.status(401).json({ success: false, message: 'Admin access required.' });
    }

    res.json({ success: true, user });
});

app.put('/api/auth/profile', (req, res) => {
    const user = getAuthUser(req);

    if (!user) {
        return res.status(401).json({ success: false, message: 'Please sign in to update your profile.' });
    }

    const users = loadUsers();
    const currentUser = users.find((item) => item.id === user.id);

    if (!currentUser) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    currentUser.profile = {
        ...(currentUser.profile || {}),
        ...req.body
    };

    saveUsers(users);
    authTokens.set(req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '', currentUser);

    res.json({ success: true, message: 'Profile updated successfully.', user: sanitizeUser(currentUser) });
});

// Admin API endpoints
app.get('/api/admin/users', (req, res) => {
    const user = getAuthUser(req);
    if (!user || !user.admin) {
        return res.status(401).json({ success: false, message: 'Admin access required.' });
    }

    const users = loadUsers().map((item) => sanitizeUser(item));
    res.json({ success: true, users });
});

app.get('/api/admin/users/:id', (req, res) => {
    const user = getAuthUser(req);
    if (!user || !user.admin) {
        return res.status(401).json({ success: false, message: 'Admin access required.' });
    }

    const users = loadUsers();
    const targetUser = users.find((item) => item.id === Number(req.params.id));

    if (!targetUser) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user: sanitizeUser(targetUser) });
});

app.post('/api/admin/users', (req, res) => {
    const admin = getAuthUser(req);
    if (!admin || !admin.admin) {
        return res.status(401).json({ success: false, message: 'Admin access required.' });
    }

    const { name, email, password, profile = {} } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const users = loadUsers();
    if (getUserByEmail(users, email)) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const newUser = {
        id: Date.now(),
        name: name.trim(),
        username: generateUsername(name, email),
        email: email.toLowerCase().trim(),
        password: hashPassword(password),
        profile: profile || {},
        createdAt: new Date().toISOString(),
        verified: true
    };

    users.push(newUser);
    saveUsers(users);

    res.status(201).json({ success: true, message: 'User created successfully.', user: sanitizeUser(newUser) });
});

app.put('/api/admin/users/:id', (req, res) => {
    const admin = getAuthUser(req);
    if (!admin || !admin.admin) {
        return res.status(401).json({ success: false, message: 'Admin access required.' });
    }

    const users = loadUsers();
    const user = users.find((item) => item.id === Number(req.params.id));

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const { name, email, password, username, profile, verified } = req.body;
    const emailChanged = email && email.toLowerCase().trim() !== user.email;

    if (emailChanged && getUserByEmail(users, email)) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    user.name = name?.trim() || user.name;
    user.email = email ? email.toLowerCase().trim() : user.email;
    user.username = username?.trim() || user.username;
    user.profile = {
        ...(user.profile || {}),
        ...(profile || {})
    };
    user.verified = verified !== undefined ? verified : user.verified;

    if (password) {
        user.password = hashPassword(password);
    }

    saveUsers(users);
    res.json({ success: true, message: 'User updated successfully.', user: sanitizeUser(user) });
});

app.delete('/api/admin/users/:id', (req, res) => {
    const admin = getAuthUser(req);
    if (!admin || !admin.admin) {
        return res.status(401).json({ success: false, message: 'Admin access required.' });
    }

    const users = loadUsers();
    const index = users.findIndex((item) => item.id === Number(req.params.id));

    if (index === -1) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const [removedUser] = users.splice(index, 1);
    saveUsers(users);

    res.json({ success: true, message: 'User deleted successfully.', user: sanitizeUser(removedUser) });
});

// Handle consultation form submission
app.post('/submit-consultation', async (req, res) => {
    const { name, email, reason, phone } = req.body;

    const consultation = {
        id: Date.now(),
        name,
        email,
        phone,
        reason,
        date: new Date().toISOString()
    };

    let consultations = [];
    if (fs.existsSync(CONSULTATIONS_FILE)) {
        const data = fs.readFileSync(CONSULTATIONS_FILE);
        consultations = JSON.parse(data);
    }
    consultations.push(consultation);
    fs.writeFileSync(CONSULTATIONS_FILE, JSON.stringify(consultations, null, 2));

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
        if (fs.existsSync(CONSULTATIONS_FILE)) {
            const data = fs.readFileSync(CONSULTATIONS_FILE);
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
});