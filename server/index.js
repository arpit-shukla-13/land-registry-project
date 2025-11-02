// server/index.js (FINAL UPDATED VERSION - Please use this one)

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Land = require('./models/Land'); // Make sure to use the updated Land model

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB!"))
  .catch(err => console.error("MongoDB connection error:", err));
  

// --- API Routes ---


// 1. Route to register new land data (UPDATED to initialize ownershipHistory)
app.post('/register-land', async (req, res) => {
    try {
        console.log("Received data for registration:", req.body);

        const { ownerName, khasraNo, ownerWalletAddress, propertyAddress, landArea, propertyValue } = req.body;

        const newLand = new Land({
            ownerName,
            khasraNo,
            ownerWalletAddress,
            propertyAddress,
            landArea,
            propertyValue,
            registrationDate: new Date(), // Set registration date here
            // Initialize ownershipHistory with the first owner
            ownershipHistory: [{
                ownerName: ownerName,
                ownerWalletAddress: ownerWalletAddress,
                transferDate: new Date() // The date of initial registration
            }]
        });

        const savedLand = await newLand.save();
        res.status(201).json({ message: "Land data saved successfully!", data: savedLand });

    } catch (error) {
        console.error("Error saving data:", error);
        if (error.code === 11000) {
            return res.status(409).json({ message: "Khasra Number already exists.", error: error.message });
        }
        res.status(500).json({ message: "Error saving land data.", error: error.message });
    }
});

// 2. Route to update the onChainId for a land record after blockchain registration (NO CHANGE)
app.patch('/update-onchain-id/:mongoId', async (req, res) => {
    try {
        const { mongoId } = req.params; 
        const { onChainId } = req.body;

        const updatedLand = await Land.findByIdAndUpdate(
            mongoId,
            { onChainId: onChainId },
            { new: true }
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

// 3. Route to get land details by onChainId (NO CHANGE)
app.get('/land-by-onchain-id/:onChainId', async (req, res) => {
    try {
        // We do not need to populate ownershipHistory here, just fetch the land record as is.
        // The frontend will construct the full timeline from this data.
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

// 4. Route to update land owner details after on-chain transfer (UPDATED - CRITICAL FIX FOR HISTORY ORDER)
app.patch('/update-land-owner/:mongoRecordId', async (req, res) => {
    try {
        const { newOwnerWalletAddress, newOwnerName } = req.body;

        if (!newOwnerWalletAddress || !newOwnerName) {
            return res.status(400).json({ message: 'New owner wallet address and name are required.' });
        }

        const landRecord = await Land.findById(req.params.mongoRecordId);
        if (!landRecord) {
            return res.status(404).json({ message: 'Off-chain land record not found.' });
        }

        // The current owner's details are stored in the main fields (landRecord.ownerName, landRecord.ownerWalletAddress).
        // Before we update these main fields with the new owner's details,
        // we take the *current* owner's details and add them to the ownershipHistory array.
        const previousOwnerEntry = {
            ownerName: landRecord.ownerName,
            ownerWalletAddress: landRecord.ownerWalletAddress,
            transferDate: new Date() // The date of this transfer
        };
        
        // Push the previous owner to the end of the history array.
        // This ensures the array is always in chronological order (oldest to newest).
        landRecord.ownershipHistory.push(previousOwnerEntry); 

        // Now, update the main fields to reflect the new owner
        landRecord.ownerName = newOwnerName;
        landRecord.ownerWalletAddress = newOwnerWalletAddress;
        // Optionally, update registrationDate to reflect the new owner's acquisition date
        landRecord.registrationDate = new Date(); // Or keep the original registrationDate for the land itself

        const updatedLand = await landRecord.save(); 

        if (!updatedLand) {
            return res.status(404).json({ message: 'Off-chain land record not found or could not be updated.' });
        }

        res.status(200).json({ message: 'Off-chain land owner updated successfully and history recorded.', data: updatedLand });
    } catch (error) {
        console.error("Error updating off-chain land owner:", error);
        res.status(500).json({ message: 'Error updating off-chain land owner.', error: error.message });
    }
});


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Off-chain server is running on port ${PORT}`);
});