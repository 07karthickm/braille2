const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    childName: String,
    age: Number,
    location: String,
    parentName: String,
    email: { type: String, unique: true },
    password: String
});

module.exports = mongoose.model('User', userSchema);
