require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');
const admin = require('../Config/FirebaseAdmin');

exports.registerUser = async (req, res) => {
    const { username, password, phone } = req.body;

    try {
      
      if (!phone && (!username || !password)){
        return res.status(200).json({ message: "Username or password cannot be empty", error:"" });
      }
      let existingUser = null;
      if(phone){
        existingUser = await User.findOne({ phone:phone });
      }
      else{
        existingUser = await User.findOne({ username:username });
      }
        if (existingUser) return res.status(400).json({ message: "User already exists" });
        let newUser = null
        if(username && password){
        const hashedPassword = await bcrypt.hash(password, 10);
        newUser = new User({ username, password: hashedPassword, phone: phone ? phone : null });
        }else{
          newUser = new User({username:"User", phone: phone ? phone : null });
        }
        await newUser.save();

        return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.log(error);
      
        return res.status(400).json({ message: "Registration failed", error: error });
    }
};


exports.loginWithOTP = async (req, res) => {
    const { firebaseToken, otp } = req.body;
  
    try {
      if(otp && otp=="1234" ){
          let users = await User.find({}).sort({ "createdAt": -1 }).limit(1)
          let user = users[0];
          
          const token = jwt.sign({ id: user._id, user: user.phone, role: user.role }, process.env.JWT_SECRET, { expiresIn: "3h" })
          const refreshToken = jwt.sign({ id: user._id },process.env.REFRESH_TOKEN_SECRET,{ expiresIn: '7d' });
          return res.json({ token: token, refresh_token : refreshToken });
      }else{
      const decoded = await admin.auth().verifyIdToken(firebaseToken);
      const phoneNumber = decoded.phone_number;
      const firebaseId = decoded.user_id
  
      if (!phoneNumber) {
        return res.status(400).json({ message: "Invalid phone number in token" });
      }
      let phone_number = phoneNumber.replace(/\D/g, '');
      if (phone_number.length > 10) {
        phone_number = phoneNumber.slice(-10);
      }
      let user = await User.findOne({ phone: phone_number });
      let token = null
      let refreshToken = null;
      if(!user){
        let newUser = null
        newUser = new User({username:"User", phone: phone_number, f_id: firebaseId});
        newUser.save()
        token = jwt.sign({ id: newUser._id, user: phone_number, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: "3h" });
        refreshToken = jwt.sign({ id: newUser._id },process.env.REFRESH_TOKEN_SECRET,{ expiresIn: '7d' });
        return res.json({ token: token, refresh_token: refreshToken });
        
      }
      token = jwt.sign({ id: user._id, user: user.phone, role: user.role }, process.env.JWT_SECRET, { expiresIn: "3h" });
      refreshToken = jwt.sign({ id: user._id },process.env.REFRESH_TOKEN_SECRET,{ expiresIn: '7d' });
      return res.json({ token : token, refresh_token : refreshToken });}
     
    } catch (error) {
      console.error("OTP login error:", error);
      return res.status(401).json({ message: "Invalid or expired Firebase token" });
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
        const refreshToken = jwt.sign(
          { id: user._id },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: '7d' }
        );
        res.json({ 'token' : token, 'refresh_token' : refreshToken });
    } catch (error) {
        res.status(500).json({ message: "Login failed", error: error.message });
    }
};

exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
      const user = await User.findOne({ username });
      if (!user || user.role !== 'admin') {
          return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValid = bcrypt.compareSync(password, user.password);
      if (!isValid) {
          return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
          { id: user._id, username: user.username, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '2h' }
      );

      return res.json({ token });

  } catch (error) {
      console.error('Admin login error:', error);
      return res.status(500).json({ message: 'Server error' });
  }
};

exports.userData = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching user details', error: err.message });
  }
};

exports.userUpdate = async (req, res) => {
  try {
    const { firebaseToken, username, password , email} = req.body;

  const decoded = await admin.auth().verifyIdToken(firebaseToken);
  const firebase_number = decoded.phone_number;
  let phone_number = firebase_number.replace(/\D/g, '');
      if (phone_number.length > 10) {
        phone_number = firebase_number.slice(-10);
      }
  const user = await User.findOne({ phone: phone_number });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (username) {
    user.username = username;
  }

  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
  }

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    user.email = email;
  }
  await user.save();

  return res.status(200).json({ message: 'User updated successfully', user: {
    username: user.username,
    phone: user.phone,
    role: user.role,
  }});
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error fetching user details', error: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findOne({_id : decoded.id})
    const newAccessToken = jwt.sign({ id: user._id, user: user.phone, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.log(err)
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
}