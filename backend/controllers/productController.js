import Product from "../models/Product.js";

// @desc    Add a new product
// @route   POST /api/products/add
export const addProduct = async (req, res) => {
  try {
    const { name, retailPrice, stock, importCost, category, image } = req.body;
    
    // Validation
    if (!name || !retailPrice || !importCost) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    const product = new Product({
      name,
      retailPrice: Number(retailPrice),
      stock: Number(stock) || 0,
      importCost: Number(importCost),
      category: category || "uncategorized",
      image: image || "",
      // If stock is 0, set outOfStockSince
      ...(Number(stock) === 0 && { outOfStockSince: new Date() })
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).json({ error: "Failed to add product" });
  }
};

// @desc    Get all products (with optional filtering)
// @route   GET /api/products/
export const getProducts = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    let query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by status (using virtuals, so we need to filter after fetching)
    let products = await Product.find(query).sort({ createdAt: -1 });

    // Apply status filter if needed
    if (status && status !== 'all') {
      products = products.filter(product => product.status === status);
    }

    // Apply search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      products = products.filter(product => 
        searchRegex.test(product.name) || 
        searchRegex.test(product.category)
      );
    }

    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
};

// @desc    Get low stock products (stock < 5)
// @route   GET /api/products/low-stock
export const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      stock: { $gt: 0, $lt: 5 } 
    }).sort({ stock: 1 });
    
    res.json(products);
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    res.status(500).json({ error: "Failed to fetch low stock products" });
  }
};

// @desc    Get out of stock products
// @route   GET /api/products/out-of-stock
export const getOutOfStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ 
      stock: 0 
    }).sort({ outOfStockSince: -1 });
    
    res.json(products);
  } catch (error) {
    console.error("Error fetching out of stock products:", error);
    res.status(500).json({ error: "Failed to fetch out of stock products" });
  }
};

// @desc    Order a product (decrease stock)
// @route   PUT /api/products/:id/order
export const orderProduct = async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const productId = req.params.id;

    // Validate quantity
    if (quantity <= 0) {
      return res.status(400).json({ error: "Quantity must be greater than 0" });
    }

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if enough stock
    if (product.stock < quantity) {
      return res.status(400).json({ 
        error: `Insufficient stock. Only ${product.stock} units available.` 
      });
    }

    // Decrease stock
    product.stock -= quantity;
    
    // If stock becomes 0, set outOfStockSince timestamp
    if (product.stock === 0) {
      product.outOfStockSince = new Date();
    } else {
      // If stock was 0 and now positive, clear outOfStockSince
      product.outOfStockSince = null;
    }

    const updatedProduct = await product.save();
    
    res.json({ 
      message: "Order placed successfully", 
      product: updatedProduct,
      orderedQuantity: quantity
    });
  } catch (error) {
    console.error("Error ordering product:", error);
    res.status(500).json({ error: "Failed to process order" });
  }
};

// @desc    Update product stock (direct update)
// @route   PUT /api/products/:id/stock
export const updateProductStock = async (req, res) => {
  try {
    const { stock } = req.body;
    const productId = req.params.id;

    // Validate stock value
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ error: "Valid stock value is required" });
    }

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update stock
    product.stock = Number(stock);
    
    // Handle outOfStockSince based on new stock value
    if (Number(stock) === 0) {
      product.outOfStockSince = product.outOfStockSince || new Date();
    } else {
      product.outOfStockSince = null;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product stock:", error);
    res.status(500).json({ error: "Failed to update product stock" });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    await product.deleteOne();
    res.json({ message: "Product removed successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ error: "Failed to delete product" });
  }
};