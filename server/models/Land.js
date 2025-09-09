const mongoose = require('mongoose');

const LandSchema = new mongoose.Schema({
    // Yeh saari details hum frontend se lenge
    ownerName: { type: String, required: true },
    khasraNo: { type: String, required: true, unique: true },
    ownerWalletAddress: { type: String, required: true },
    propertyAddress: { type: String, required: true },
    landArea: { type: String, required: true },

    // Yeh naye, zaroori fields hain
    propertyValue: { type: Number, required: true },
    previousOwnerName: { type: String, default: "N/A" }, // Nayi zameen ke liye yeh "N/A" hoga

    // Yeh details server automatisch set karega
    onChainId: { type: Number, default: null }, // Jab blockchain par register hoga, tab yeh ID yahan aayegi
    registrationDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Land', LandSchema);