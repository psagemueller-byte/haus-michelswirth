const crypto = require('crypto');
const { createToken } = require('./_utils/auth');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password } = req.body || {};
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        return res.status(500).json({ error: 'Admin not configured' });
    }

    if (!password) {
        return res.status(400).json({ error: 'Password required' });
    }

    const match = crypto.timingSafeEqual(
        Buffer.from(password),
        Buffer.from(adminPassword)
    );

    if (!match) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    const token = createToken();
    return res.status(200).json({ token });
};
