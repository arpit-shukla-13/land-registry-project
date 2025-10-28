require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import the Land model
const Land = require('./models/Land');

const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB!"))
  .catch(err => console.error("MongoDB connection error:", err));

// --- API Routes ---

// 1. Route to register new land data
app.post('/register-land', async (req, res) => {
    try {
        console.log("Received data for registration:", req.body);

        const newLand = new Land({
            ownerName: req.body.ownerName,
            khasraNo: req.body.khasraNo,
            ownerWalletAddress: req.body.ownerWalletAddress,
            propertyAddress: req.body.propertyAddress,
            landArea: req.body.landArea,
            propertyValue: req.body.propertyValue, 
            previousOwnerName: req.body.previousOwnerName || "N/A" 
        });

        const savedLand = await newLand.save();
        res.status(201).json({ message: "Land data saved successfully!", data: savedLand });

    } catch (error) {
        console.error("Error saving data:", error);
        // E11000 is for duplicate key error (e.g., khasraNo)
        if (error.code === 11000) {
            return res.status(409).json({ message: "Khasra Number already exists.", error: error.message });
        }
        res.status(500).json({ message: "Error saving land data.", error: error.message });
    }
});

// 2. Route to update the onChainId for a land record after blockchain registration
app.patch('/update-onchain-id/:mongoId', async (req, res) => {
    try {
        const { mongoId } = req.params; 
        const { onChainId } = req.body;

        const updatedLand = await Land.findByIdAndUpdate(
            mongoId,
            { onChainId: onChainId },
            { new: true } // Return the updated document
        );

        if (!updatedLand) {
            return res.status(404).json({ message: "Record not found in database." });
        }

        res.status(200).json({ message: "On-chain ID linked successfully!", data: updatedLand });

    } catch (error) {
        console.error("Error updating on-chain ID:", error);
        res.status(500).json({ message: "Error linking on-chain ID.", error: error.message });
    }
});

// --- NEW: 3. Route to get land details by onChainId (used by Transfer.jsx to get MongoDB _id) ---
app.get('/land-by-onchain-id/:onChainId', async (req, res) => {
    try {
        const land = await Land.findOne({ onChainId: req.params.onChainId });
        if (!land) {
            return res.status(404).json({ message: 'Land not found in off-chain database.' });
        }
        res.status(200).json({ message: 'Land found', data: land });
    } catch (error) {
        console.error("Error fetching land by onChainId:", error);
        res.status(500).json({ message: 'Error fetching land by onChainId.', error: error.message });
    }
});

// --- UPDATED: 4. Route to update land owner details after on-chain transfer ---
app.patch('/update-land-owner/:mongoRecordId', async (req, res) => {
    try {
        const { newOwnerWalletAddress, newOwnerName } = req.body; // <-- newOwnerName ko yahan extract kar rahe hain

        if (!newOwnerWalletAddress || !newOwnerName) { // Don't forget newOwnerName validation
            return res.status(400).json({ message: 'New owner wallet address and name are required.' });
        }

        // Fetch the old land record to get current owner's name and previous owner's name
        const oldLandRecord = await Land.findById(req.params.mongoRecordId);
        if (!oldLandRecord) {
            return res.status(404).json({ message: 'Off-chain land record not found.' });
        }

        // The current owner's name becomes the previous owner's name
        const previousOwnerNameForUpdate = oldLandRecord.ownerName; 
        
        // Find the land by its MongoDB _id and update its owner details
        const updatedLand = await Land.findByIdAndUpdate(
            req.params.mongoRecordId,
            {
                ownerWalletAddress: newOwnerWalletAddress,
                ownerName: newOwnerName, // <-- Yahan naye owner ka naam set kar rahe hain
                previousOwnerName: previousOwnerNameForUpdate, 
            },
            { new: true } // Return the updated document
        );

        if (!updatedLand) {
            return res.status(404).json({ message: 'Off-chain land record not found or could not be updated.' });
        }

        res.status(200).json({ message: 'Off-chain land owner updated successfully.', data: updatedLand });
    } catch (error) {
        console.error("Error updating off-chain land owner:", error);
        res.status(500).json({ message: 'Error updating off-chain land owner.', error: error.message });
    }
});


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Off-chain server is running on port ${PORT}`);
});