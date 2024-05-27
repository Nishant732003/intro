const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
router.get('/products', productController.getAllProducts);
router.get('/products/:id', productController.getProductById);
router.get('/products/category/:categoryId', productController.getProductByCategoryId);
router.get(
  "/products/categoryFilter/:categoryId",
  productController.getProductsByCategoryIdAndPriceRange
);

router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
module.exports = router;