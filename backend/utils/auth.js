const jwt = require('jsonwebtoken');
const config = require('../config/config');

const generateTokens = (payload) => {
    const accessToken = jwt.sign(
        payload,
        config.jwt.secret,
        { expiresIn: config.jwt.accessExpirationMinutes * 60 }
    );

    const refreshToken = jwt.sign(
        { ...payload, type: 'refresh' },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpirationDays * 24 * 60 * 60 }
    );

    return { accessToken, refreshToken };
};

const verifyToken = (token, isRefresh = false) => {
    const secret = isRefresh ? config.jwt.refreshSecret : config.jwt.secret;
    return jwt.verify(token, secret);
};

module.exports = {
    generateTokens,
    verifyToken
};
