const MedicalRecord = require('../models/medicalrecord.js');

// Function to create a new medical record
const createMedicalRecord = async (request, response) => {
  try {
    // Extract fields from request body
    const {
      vetID,
      vetName,
      bookingID,
      date,
      petName,
      species,
      other,
      gender,
      dob,
      vaccination,
      nextVaccination,
      remarks,
      symptoms,
      allergies,
      surgicalHistory
    } = request.body;

    // Check if required fields are present
    if (!vetID || !vetName || !bookingID || !date || !petName || !species || !gender || !dob || !vaccination || !nextVaccination) {
      return response.status(400).send({
        message: 'Send all required fields',
      });
    }

    // Create a new MedicalRecord instance and save to the database
    const newRecord = await MedicalRecord.create({
      vetID,
      vetName,
      bookingID,
      date,
      petName,
      species,
      other,
      gender,
      dob,
      vaccination,
      nextVaccination,
      remarks,
      symptoms,
      allergies,
      surgicalHistory
    });

    // Send the newly created MedicalRecord as response
    return response.status(201).send(newRecord);
  } catch (error) {
    // Handle any errors and send appropriate response
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
};

// Function to get all medical records
const getAllMedicalRecords = async (request, response) => {
  // try {
  //   // Find all Medical Records from the database
  //   const records = await MedicalRecord.find({});

  //   // Send response with the array of Medical Records
  //   return response.status(200).json({
  //     count: records.length,
  //     data: records,
  //   });
  // } catch (error) {
  //   // Handle any errors and send appropriate response
  //   console.log(error.message);
  //   response.status(500).send({ message: error.message });
  // }
  try{
    const record = await MedicalRecord.find({})
    response.status(200).json(record)
  }catch(error){
    response.status(404).json({error:error.message})
  }
};

// Function to get a single medical record by id
const getMedicalRecordById = async (request, response) => {
  try {
    // Extract the id from request parameters
    const { id } = request.params;

    // Find the Medical Record by id from the database
    const record = await MedicalRecord.findById(id);

    // Send response with the found Medical Record
    return response.status(200).json(record);
  } catch (error) {
    // Handle any errors and send appropriate response
    console.log(error.message);
    response.status(500).send({ message: error.message });
  }
};

// Function to update a medical record
const updateMedicalRecord = async (request, response) => {
  try {
    // Extract the id from request parameters
    const { id } = request.params;
    
    // Check if user is authenticated
    if (!request.user) {
      return response.status(401).json({ message: 'Authentication required' });
    }
    
    const userID = request.user.id;
    const userRole = request.user.role;
    
    // Validate medical record ID format
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return response.status(400).json({ message: 'Invalid medical record ID format' });
    }
    
    // Find the medical record first to check ownership
    const existingRecord = await MedicalRecord.findById(id);
    
    if (!existingRecord) {
      return response.status(404).json({ message: 'Medical record not found' });
    }
    
    // Authorization check - only the creating doctor or admin can update
    if (userRole !== 'doctor' && existingRecord.vetID !== userID) {
      return response.status(403).json({ message: 'Access denied. You can only update medical records you created.' });
    }
    
    // Sanitize input - define allowed fields for updates
    const allowedUpdates = ['vetName', 'date', 'petName', 'species', 'other', 'gender', 'dob', 'vaccination', 'nextVaccination', 'remarks', 'symptoms', 'allergies', 'surgicalHistory'];
    const sanitizedUpdates = {};
    
    for (const key of allowedUpdates) {
      if (request.body[key] !== undefined) {
        sanitizedUpdates[key] = request.body[key];
      }
    }
    
    // Prevent changing vetID and bookingID unless admin
    if (userRole === 'admin') {
      if (request.body.vetID) sanitizedUpdates.vetID = request.body.vetID;
      if (request.body.bookingID) sanitizedUpdates.bookingID = request.body.bookingID;
    }

    // Update the Medical Record by id with sanitized data
    const result = await MedicalRecord.findByIdAndUpdate(id, sanitizedUpdates, { new: true, runValidators: true });

    // Send success response
    return response.status(200).json({ message: 'Medical record updated successfully', record: result });
  } catch (error) {
    // Handle any errors and send appropriate response
    console.error('Medical record update error:', error);
    response.status(500).send({ message: 'Failed to update medical record' });
  }
};

// Function to delete a medical record
const deleteMedicalRecord = async (request, response) => {
  try {
    // Extract the id from request parameters
    const { id } = request.params;
    
    // Check if user is authenticated
    if (!request.user) {
      return response.status(401).json({ message: 'Authentication required' });
    }
    
    const userID = request.user.id;
    const userRole = request.user.role;
    
    // Validate medical record ID format
    if (!require('mongoose').Types.ObjectId.isValid(id)) {
      return response.status(400).json({ message: 'Invalid medical record ID format' });
    }
    
    // Find the medical record first to check ownership
    const existingRecord = await MedicalRecord.findById(id);
    
    if (!existingRecord) {
      return response.status(404).json({ message: 'Medical record not found' });
    }
    
    // Authorization check - only the creating doctor or admin can delete
    if (userRole !== 'admin' && existingRecord.vetID !== userID) {
      return response.status(403).json({ message: 'Access denied. You can only delete medical records you created.' });
    }

    // Delete the Medical Record by id from the database
    const result = await MedicalRecord.findByIdAndDelete(id);

    // Send success response
    return response.status(200).send({ message: 'Medical record deleted successfully' });
  } catch (error) {
    // Handle any errors and send appropriate response
    console.error('Medical record deletion error:', error);
    response.status(500).send({ message: 'Failed to delete medical record' });
  }
};

module.exports = {
  createMedicalRecord,
  getAllMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord
};
