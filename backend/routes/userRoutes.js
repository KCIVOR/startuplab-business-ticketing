import express from 'express';
import {getUser, getAllUsers, getRole, getRoleByEmail, whoAmI, updatePermissions} from "../controller/userController.js"
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.get('/user', authMiddleware, getUser);
router.get('/users/all', authMiddleware, getAllUsers);
router.get('/whoAmI', authMiddleware, whoAmI);
router.get('/user/role', authMiddleware, getRole);
router.get('/role-by-email', getRoleByEmail);
// Alias to match frontend path /api/user/role-by-email
router.get('/user/role-by-email', getRoleByEmail);
router.put('/users/:id/permissions', authMiddleware, updatePermissions);

export default router;