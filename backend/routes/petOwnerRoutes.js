const express = require('express')
const { authenticateToken } = require('../middlewear/authMiddleware')
//controller imports
const petOwnerController = require('../controllers/petOwnerController')

//router
const petOwnerRouter = express.Router()

//routes
petOwnerRouter.post('/login', petOwnerController.login)

petOwnerRouter.post('/signin', petOwnerController.signin)

//update and delete routes are protected and only accessible to authenticated users
petOwnerRouter.put('/updateUserDetailsFromToken', authenticateToken, petOwnerController.updateUserDetailsFromToken)

petOwnerRouter.delete('/deleteUserDetailsFromToken', authenticateToken, petOwnerController.deleteUserDetailsFromToken)

petOwnerRouter.get('/getAllUsers', petOwnerController.getAllUsers)

//verify token route to check if the token is valid and the user is a pet owner
petOwnerRouter.get('/verifyToken', authenticateToken, petOwnerController.verifyToken)

petOwnerRouter.delete('/deleteUserFromUserID/:userID',  petOwnerController.deleteUserFromUserID)

module.exports = petOwnerRouter