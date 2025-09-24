const express = require('express')
const { authenticateToken, requireDoctor, requireAdmin } = require('../middlewear/authMiddleware')
//controller imports
const doctorController = require('../controllers/doctorContoller')

//router
const doctorRouter = express.Router()

//routes
doctorRouter.get('/getAllDocs', doctorController.getAllDocs)

doctorRouter.post('/login', doctorController.login)

//create route is protected and only accessible to authenticated admins
doctorRouter.post('/createDoctor', authenticateToken, requireAdmin, doctorController.createDoctor)

//update route is protected and only accessible to authenticated doctors
doctorRouter.put('/updateDoctorDetailsFromToken', authenticateToken, requireDoctor, doctorController.updateDoctorDetailsFromToken)

//delete route is protected and only accessible to authenticated doctors
doctorRouter.delete('/deleteDoctorDetailsFromToken', authenticateToken, requireDoctor, doctorController.deleteDoctorDetailsFromToken)

doctorRouter.get('/availableDoctors', doctorController.getAvailableDoctors)

//protected route to update doctor details by admin using doctor ID
doctorRouter.put('/updateDoctorFromID/:docID', authenticateToken, requireAdmin, doctorController.updateDoctorFromID)

//protected route to delete doctor by admin using doctor ID
doctorRouter.delete('/deleteDoctorFromID/:docID', authenticateToken, requireAdmin, doctorController.deleteDoctorFromID)

//verify token route to check if the token is valid and the user is a doctor
doctorRouter.get('/verifyToken', authenticateToken, requireDoctor, doctorController.verifyToken)

module.exports = doctorRouter