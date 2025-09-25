require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import the Land model we just created
const Land = require('./models/Land');

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log("Successfully connected to MongoDB!"))
  .catch(err => console.error("MongoDB connection error:", err));

// --- API Routes ---

app.post('/register-land', async (req, res) => {
    try {
        console.log("Received data:", req.body);

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
        res.status(500).json({ message: "Error saving land data.", error: error.message });
    }
});


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


const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Off-chain server is running on port ${PORT}`);
});