// server/models/Land.js
const mongoose = require('mongoose');

const OwnershipRecordSchema = new mongoose.Schema({
    ownerName: { type: String, required: true },
    ownerWalletAddress: { type: String, required: true },
    transferDate: { type: Date, default: Date.now },
    // You could also store a snapshot of other details like khasraNo, propertyAddress
    // if you want the "view land at that historical point" functionality.
    // For now, let's keep it simple with just name and address.
});

const LandSchema = new mongoose.Schema({
    ownerName: { type: String, required: true }, // Current owner name
    khasraNo: { type: String, required: true, unique: true },
    ownerWalletAddress: { type: String, required: true }, // Current owner wallet address
    propertyAddress: { type: String, required: true },
    landArea: { type: String, required: true },
    propertyValue: { type: Number, required: true },
    onChainId: { type: Number, default: null },
    registrationDate: { type: Date, default: Date.now },


    // This array will store the chronological history of ALL owners
    // The current owner is NOT in this array; their details are in the main fields.
    
    

    ownershipHistory: {
        type: [OwnershipRecordSchema],
        default: []
    }
});

module.exports = mongoose.model('Land', LandSchema);