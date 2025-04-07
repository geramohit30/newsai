require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');
const admin = require("firebase-admin");

admin.initializeApp({
    credential: admin.credential.cert(require("../serviceAccountKey.json"))
  });

exports.registerUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
};


exports.loginWithOTP = async (req, res) => {
    const { firebaseToken } = req.body;
  
    try {
      const decoded = await admin.auth().verifyIdToken(firebaseToken);
  
      const phoneNumber = decoded.phone_number;
  
      if (!phoneNumber) {
        return res.status(400).json({ message: "Invalid phone number in token" });
      }

      let user = await User.findOne({ phone: phoneNumber });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const token = jwt.sign({ id: user._id, user: phoneNumber, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" }
      );
  
      res.json({ token });
    } catch (error) {
      console.error("OTP login error:", error);
      res.status(401).json({ message: "Invalid or expired Firebase token" });
    }
  };


exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "Invalid username or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid username or password" });

        const token = jwt.sign({ id: user._id, user: username, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: "Login failed", error: error.message });
    }
};

exports.adminLogin = async (req, res) => {
    const { username, password } = req.body;

    if (username !== process.env.ADMIN_USERNAME) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH);
    if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.json({ token });
};

module.exports = router;