const express = require('express')
const { authenticateToken, requireAdmin } = require('../middlewear/authMiddleware')
const {
    getInventoryItems,
    getInventoryItem,
    addNewItem,
    deleteItem,
    updateItem,
    updateItemStockCount
}= require('../controllers/inventoryControllers')

const router = express.Router()

// Public routes
router.get('/', getInventoryItems)
router.get('/:id', getInventoryItem)
router.put('/updateStockCount/:id', updateItemStockCount)

// Protected admin routes
router.post('/', authenticateToken, requireAdmin, addNewItem)
router.delete('/:id', authenticateToken, requireAdmin, deleteItem)
router.put('/:id', authenticateToken, requireAdmin, updateItem)

module.exports = router