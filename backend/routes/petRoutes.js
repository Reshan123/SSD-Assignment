const express = require('express')
const { authenticateToken, requireAdmin } = require('../middlewear/authMiddleware')
const { getAllPets, getSinglePet, getOneOwnerPets, createPet, adminCreatePet, deletePetFromID, updatePetFromID } = require('../controllers/petController')

const petRouter = express.Router()

const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Images/PetImages')
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + Math.floor(Math.random() * 1000000) + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage
})

petRouter.get("/getAllPets", getAllPets)
petRouter.get("/getSinglePet/:id", getSinglePet)
petRouter.get("/getOneOwnerPets", authenticateToken, getOneOwnerPets)

petRouter.post("/createPet", authenticateToken, upload.array('petImage', 5), createPet)
petRouter.post("/adminCreatePet", authenticateToken, requireAdmin, upload.array('petImage', 5), adminCreatePet)

petRouter.delete("/deletePetFromID/:petID", authenticateToken, deletePetFromID)
petRouter.put("/updatePetFromID/:petID", authenticateToken, upload.array('petImage', 5), updatePetFromID)

module.exports = petRouter