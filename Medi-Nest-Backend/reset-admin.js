const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const User = require('./src/models/User');
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    await User.updateOne(
        { role: 'admin' },
        { 
            $set: { password: hashedPassword, email: 'admin@medinest.com' },
            $unset: { availability: 1 } 
        }
    );
    console.log("SUCCESS: Admin reset to admin@medinest.com / admin123");
    process.exit(0);
});
