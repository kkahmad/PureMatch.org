const fs = require('fs');
const crypto = require('crypto');

function readJsonFile(filePath, defaultValue) {
    if (!fs.existsSync(filePath)) {
        return defaultValue;
    }

    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        return defaultValue;
    }
}

function writeJsonFile(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

function generateUsername(name, email) {
    const base = (name || email || 'user')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .slice(0, 12);

    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `${base || 'user'}${suffix}`;
}

module.exports = {
    readJsonFile,
    writeJsonFile,
    hashPassword,
    verifyPassword,
    generateUsername
};
