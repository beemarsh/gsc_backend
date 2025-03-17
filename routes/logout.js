const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    // Cookie options must match the ones used when setting the cookies
    res.clearCookie('accessToken', {
        domain: 'api.glfsouth.info', // Must match the set domain
        httpOnly: true,
        secure: true,
        sameSite: 'None', // Match the original setting
        path: '/'
    });
    

    res.clearCookie('accessToken', {
        domain: 'api.gulfsouth.info', // Must match the set domain
        httpOnly: true,
        secure: true,
        sameSite: 'None', // Match the original setting
        path: '/'
    });

    res.clearCookie('refreshToken', {
        domain: 'api.gulfsouth.info', // Must match the set domain
        httpOnly: true,
        secure: true,
        sameSite: 'None', // Match the original setting
        path: '/'
    });
    

    return res.json({ message: 'Logged out successfully' });
});

module.exports = router;
