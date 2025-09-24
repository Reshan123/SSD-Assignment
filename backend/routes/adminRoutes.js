const express = require('express')
const { authenticateToken, requireAdmin } = require('../middlewear/authMiddleware')
//controller imports
const adminController = require('../controllers/adminController')

//router
const adminRouter = express.Router()

//routes
adminRouter.post('/login', adminController.login)

//verify token route to check if the token is valid and the user is a doctor
adminRouter.get('/verifyToken', authenticateToken, requireAdmin, adminController.verifyToken)

module.exports = adminRouter