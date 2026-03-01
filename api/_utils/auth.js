const crypto = require('crypto');

function getHmacKey() {
    return crypto.createHash('sha256')
        .update('haus-michelswirth:' + process.env.ADMIN_PASSWORD)
        .digest();
}

function createToken() {
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    const signature = crypto.createHmac('sha256', getHmacKey())
        .update(String(expiry))
        .digest('hex');
    return `${expiry}.${signature}`;
}

function verifyToken(token) {
    if (!token || !process.env.ADMIN_PASSWORD) return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [expiry, signature] = parts;
    if (Date.now() > Number(expiry)) return false;

    const expected = crypto.createHmac('sha256', getHmacKey())
        .update(expiry)
        .digest('hex');

    try {
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expected, 'hex')
        );
    } catch {
        return false;
    }
}

function authenticate(req) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) return false;
    return verifyToken(auth.slice(7));
}

module.exports = { createToken, verifyToken, authenticate };
