import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { requireAdmin } from '../middlewares/auth';

const router = Router();

router.get('/', CategoryController.getCategories);
router.get('/:slug', CategoryController.getCategoryBySlug);
router.post('/', requireAdmin, CategoryController.createCategory);
router.put('/:id', requireAdmin, CategoryController.updateCategory);
router.delete('/:id', requireAdmin, CategoryController.deleteCategory);

export default router;
