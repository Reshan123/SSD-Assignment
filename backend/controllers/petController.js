const validator = require('validator')
let mongoose = require('mongoose');
const pet = require('../models/petModel')


const createPet = async (req, res) => {
    const userID = req.user.id
    const {petName,petAge,petSpecies,petGender,petBreed} = req.body

    try{
        const { files } = req;
        const filenames = files.map(file => (file.filename))
        if (!petName || !petAge || !petSpecies || !petGender || !petBreed || files.length == 0) {
            throw Error('All fields must be filled')
        }
        if(!validator.isAlpha(petName, ['en-US'], {ignore: '-s'})){
            throw Error('Pet name can only have letters')
        }
        if(!validator.isAlpha(petSpecies, ['en-US'], {ignore: '-s'})){
            throw Error('pet species can only have letters')
        }
        if(!validator.isAlpha(petGender, ['en-US'], {ignore: '-s'})){
            throw Error('Pet gender can only have letters')
        }
        if(!validator.isAlpha(petBreed, ['en-US'], {ignore: '-s'})){
            throw Error('Pet breed can only have letters')
        }


        const petResponse = await pet.create({ownerID: userID,petName,petAge,petSpecies,petGender,petBreed,petImage:[...filenames]})

        res.status(200).json({message: petResponse})
    } catch (error){
        res.status(400).json({message: error.message})
    }
}

const adminCreatePet = async (req, res) => {
    const {ownerID, petName,petAge,petSpecies,petGender,petBreed} = req.body

    
    try{
        const { files } = req;
        const filenames = files.map(file => (file.filename))
        // let ownerID = mongoose.Types.ObjectId(userID);

        if (!ownerID || !petName || !petAge || !petSpecies || !petGender || !petBreed || files.length == 0) {
            throw Error('All fields must be filled')
        }
        if(!validator.isAlpha(petName, ['en-US'], {ignore: '-s'})){
            throw Error('Pet name can only have letters')
        }
        if(!validator.isAlpha(petSpecies, ['en-US'], {ignore: '-s'})){
            throw Error('pet species can only have letters')
        }
        if(!validator.isAlpha(petGender, ['en-US'], {ignore: '-s'})){
            throw Error('Pet gender can only have letters')
        }
        if(!validator.isAlpha(petBreed, ['en-US'], {ignore: '-s'})){
            throw Error('Pet breed can only have letters')
        }


        const petResponse = await pet.create({ownerID, petName,petAge,petSpecies,petGender,petBreed,petImage:[...filenames]})

        res.status(200).json({message: petResponse})
    } catch (error){
        res.status(400).json({message: error.message})
    }
}

const getAllPets = async (req, res) => {
    
    try{
        const allPets = await pet.find()

        res.status(200).json({message: allPets})

    } catch (error){
        res.status(400).json({message: error.message})
    }

}

const getSinglePet = async (req, res) => {
    const { id } = req.params
    try{
        const petDetails = await pet.findById(id)

        res.status(200).json({message: petDetails})

    } catch (error){
        res.status(400).json({message: error.message})
    }
}

const getOneOwnerPets = async (req, res) => {
    const userID = req.user.id
    try{
        if (!userID){
            throw Error("Invalid User ID")
        }

        const allPets = await pet.find({ownerID: userID})

        res.status(200).json({message: allPets})

    } catch (error){
        res.status(400).json({message: error.message})
    }
}

const deletePetFromID = async (req, res) => {
    const { petID } = req.params
    
    // Check if user is authenticated
    if (!req.user) {
        return res.status(401).json({message: 'Authentication required'})
    }
    
    const userID = req.user.id
    const userRole = req.user.role

    try{
        // Validate pet ID format
        if (!mongoose.Types.ObjectId.isValid(petID)) {
            return res.status(400).json({message: 'Invalid pet ID format'})
        }

        const petExist = await pet.findById(petID)
        if(!petExist){
            throw Error("Pet not found")
        }

        // Authorization check - only owner or admin can delete
        if (userRole !== 'admin' && petExist.ownerID.toString() !== userID) {
            return res.status(403).json({message: 'Access denied. You can only delete your own pets.'})
        }

        const response = await pet.findByIdAndDelete(petID)
        res.status(200).json({message: "Pet Deleted"})

    } catch (error){
        res.status(400).json({message: error.message})
    }
}

const updatePetFromID = async (req, res) => {
    const { petID } = req.params
    
    // Check if user is authenticated
    if (!req.user) {
        return res.status(401).json({message: 'Authentication required'})
    }
    
    const userID = req.user.id
    const userRole = req.user.role
    const {ownerID, petName, petAge, petSpecies, petGender, petBreed} = req.body
    const options = {
        new: true,
        runValidators: true
    }
    
    try{
        // Validate pet ID format
        if (!mongoose.Types.ObjectId.isValid(petID)) {
            return res.status(400).json({message: 'Invalid pet ID format'})
        }

        const { files } = req;
        console.log(files)
        const filenames = files ? files.map(file => (file.filename)) : []
        const petExist = await pet.findById(petID)
        if(!petExist){
            throw Error("Pet not found")
        }

        // Authorization check - only owner or doctor can update it
        if (userRole !== 'doctor' && petExist.ownerID.toString() !== userID) {
            return res.status(403).json({message: 'Access denied. You can only update your own pets.'})
        }

        // Sanitize input - define allowed fields for updates
        const allowedUpdates = ['petName', 'petAge', 'petSpecies', 'petGender', 'petBreed'];
        const sanitizedUpdates = {};
        
        // Only allow updates to specific fields
        for (const key of allowedUpdates) {
            if (req.body[key] !== undefined) {
                sanitizedUpdates[key] = req.body[key];
            }
        }

        // Prevent ownerID from being changed unless doctor
        if (userRole === 'doctor' && ownerID) {
            sanitizedUpdates.ownerID = ownerID;
        }

        // Validate required fields
        if (!sanitizedUpdates.petName || !sanitizedUpdates.petAge || !sanitizedUpdates.petSpecies || 
            !sanitizedUpdates.petGender || !sanitizedUpdates.petBreed) {
            throw Error('All fields must be filled')
        }

        // Validate field formats
        if(!validator.isAlpha(sanitizedUpdates.petName, ['en-US'], {ignore: '-s'})){
            throw Error('Pet name can only have letters')
        }
        if(!validator.isAlpha(sanitizedUpdates.petSpecies, ['en-US'], {ignore: '-s'})){
            throw Error('pet species can only have letters')
        }
        if(!validator.isAlpha(sanitizedUpdates.petGender, ['en-US'], {ignore: '-s'})){
            throw Error('Pet gender can only have letters')
        }
        if(!validator.isAlpha(sanitizedUpdates.petBreed, ['en-US'], {ignore: '-s'})){
            throw Error('Pet breed can only have letters')
        }

        // Handle image updates
        if(filenames.length > 0){
            sanitizedUpdates.petImage = [...filenames];
        }

        const response = await pet.findByIdAndUpdate(petID, sanitizedUpdates, options)
        res.status(200).json({message: response})

    } catch(error){
        res.status(400).json({message: error.message})
    }
}

module.exports = { getAllPets, getSinglePet, getOneOwnerPets, createPet, adminCreatePet, deletePetFromID, updatePetFromID }