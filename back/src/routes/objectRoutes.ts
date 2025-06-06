import express from 'express';
import {
  getObjects,
  getObjectById,
  createObject,
  updateObject,
  deleteObject,
  getObjectsStats,
  getObjectsNearby
} from '../controllers/objectController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();

// Публичные роуты (доступны всем)
router.get('/', getObjects);                    // GET /api/objects
router.get('/stats', getObjectsStats);          // GET /api/objects/stats
router.get('/nearby', getObjectsNearby);        // GET /api/objects/nearby
router.get('/:id', getObjectById);              // GET /api/objects/:id

// Защищенные роуты (только для админов)
router.post('/', authenticateToken, requireAdmin, createObject);                 // POST /api/objects
router.put('/:id', authenticateToken, requireAdmin, updateObject);               // PUT /api/objects/:id
router.delete('/:id', authenticateToken, requireAdmin, deleteObject);            // DELETE /api/objects/:id

export default router; 