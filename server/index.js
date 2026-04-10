// server/index.js (FINAL UPDATED VERSION with Lat/Lng & Clear Database support)

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Land = require('./models/Land'); 

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB!"))
  .catch(err => console.error("MongoDB connection error:", err));

// --- API Routes ---

// 1. Route to register new land data
app.post('/register-land', async (req, res) => {
    try {
        console.log("Received data for registration:", req.body);

        // NAYI FIELDS YAHAN ADD KI HAIN (latitude, longitude)
        const { ownerName, khasraNo, ownerWalletAddress, propertyAddress, landArea, propertyValue, latitude, longitude } = req.body;

        const newLand = new Land({
            ownerName,
            khasraNo,
            ownerWalletAddress,
            propertyAddress,
            landArea,
            propertyValue,
            latitude,   // <-- Added
            longitude,  // <-- Added
            registrationDate: new Date(), 
            ownershipHistory: [{
                ownerName: ownerName,
                ownerWalletAddress: ownerWalletAddress,
                transferDate: new Date() 
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

// 2. Route to update the onChainId for a land record after blockchain registration
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

// 3. Route to get land details by onChainId
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

// 4. Route to update land owner details after on-chain transfer
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

        const previousOwnerEntry = {
            ownerName: landRecord.ownerName,
            ownerWalletAddress: landRecord.ownerWalletAddress,
            transferDate: new Date()
        };
        
        landRecord.ownershipHistory.push(previousOwnerEntry); 

        landRecord.ownerName = newOwnerName;
        landRecord.ownerWalletAddress = newOwnerWalletAddress;
        landRecord.registrationDate = new Date(); 

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

// 5. --- DANGER ZONE: Delete All Lands API (For Testing Only) ---
app.delete('/clear-all-lands', async (req, res) => {
    try {
        await Land.deleteMany({});
        res.status(200).json({ message: "All land records successfully deleted from the database." });
    } catch (error) {
        console.error("Error deleting all records:", error);
        res.status(500).json({ message: "Error clearing database.", error: error.message });
    }
});

// --- YEH NAYA ROUTE ADD KARO server/index.js MEIN ---

// 6. Route to fetch ALL lands for the search bar and cards
app.get('/all-lands', async (req, res) => {
    try {
        // Sirf wo lands bhejenge jinka onChainId null nahi hai (jo successfully blockchain pe hain)
        const lands = await Land.find({ onChainId: { $ne: null } });
        res.status(200).json({ message: 'Lands fetched successfully', data: lands });
    } catch (error) {
        console.error("Error fetching all lands:", error);
        res.status(500).json({ message: 'Error fetching lands.', error: error.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Off-chain server is running on port ${PORT}`);
});