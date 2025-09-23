const express = require('express')
const { authenticateToken } = require('../middlewear/authMiddleware')
const LostNoticeInfo = require('../models/lostPetNoticeModel')

const router = express.Router()

//importing the route handlers
const {createLostPetNotice,getNotice,getAllNotice,updateLostPetNotice,deleteLostPetNotice,getUserLostPetNotice}=require('../controllers/lostPetNoticeController')

//route to create/posting the notice
router.post('/', authenticateToken, createLostPetNotice)

//retriving a paticular notice
router.get('/getSingleNotice/:id', getNotice)

//retriving all the notices
router.get('/',getAllNotice)

//updating the notice
router.patch('/:id', updateLostPetNotice)

//deleteing the notice
router.delete('/:id', deleteLostPetNotice)

//getting the logged in user
router.get('/getUser', authenticateToken, getUserLostPetNotice)

module.exports = router
