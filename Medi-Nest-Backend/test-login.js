const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = require('./src/models/User');
    const admin = await User.findOne({role: 'admin'}).select('+password');
    console.log("Found admin:", admin?.email);
    if(admin) {
        console.log("Hashed password directly from DB:", admin.password);
        const isMatch = await bcrypt.compare("admin123", admin.password);
        console.log("Compare with 'admin123':", isMatch);
    }

    const axios = require('axios');
    try {
        const res = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'admin@medinest.com',
            password: 'admin123'
        });
        console.log("Login API Result:", "SUCCESS");
    } catch(err) {
        console.error("Login API Error:", err.response?.data);
    }

    process.exit(0);
});
