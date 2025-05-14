const jwt = require('jsonwebtoken');

exports.authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid token.", error: error.message });
    }
};

exports.authNewsMiddleware = (req, res, next) => {
    console.log('HERE')
    const token = req?.header('Authorization');
    console.log('LINE 21',token)
    if (!token) {
        console.log('LINE 23',token);
        return true;
    }
    else{
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid token.", error: error.message });
    }}
};