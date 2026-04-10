import Order from "../models/Order.js";
import Product from "../models/Product.js";
import PreOrder from "../models/PreOrder.js";

// @desc    Create a new order (standard checkout)
// @route   POST /api/orders
export const createOrder = async (req, res) => {
  try {
    const { items, totalAmount, shippingAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: "No order items provided" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ error: "Shipping address is required" });
    }

    // First check stock for all items
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.name || 'product'}` 
        });
      }
    }

    // Deduct stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      product.stock -= item.quantity;
      if (product.stock === 0) product.outOfStockSince = new Date();
      await product.save();
    }

    // Feature 11 Upgrade: Smart Priority & Logistics Intelligence
    const orderTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const priority = orderTotal > 50000 ? 'HIGH' : 'MEDIUM';
    
    // Smart Courier Suggestion based on City (Feature 12 Upgrade)
    let suggestedCourier = 'Steadfast'; // Default
    const city = shippingAddress.city.toLowerCase();
    if (city.includes('dhaka')) suggestedCourier = 'Pathao';
    else if (city.includes('chittagong') || city.includes('sylhet')) suggestedCourier = 'RedX';

    const order = new Order({
      user: req.user._id,
      items,
      totalAmount,
      shippingAddress,
      status: "PENDING",
      priority,
      suggestedCourier,
      statusHistory: [{
        status: 'PENDING',
        note: `Order initialized. Priority set to ${priority} based on value.`
      }]
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/my
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get all active orders (Queue/Admin)
// @route   GET /api/orders
export const getActiveOrders = async (req, res) => {
  try {
    // Return pending and processing orders
    const orders = await Order.find({ status: { $in: ["PENDING", "PROCESSING", "SHIPPED"] } })
      .populate("user", "name email")
      .sort({ createdAt: 1 }); // Oldest first
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Cancel order (User or Admin)
// @route   DELETE /api/orders/:id
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ error: "Order not found" });

    // Ensure only PENDING orders can be cancelled directly by users
    if (order.status !== "PENDING" && req.user.role !== "admin") {
      return res.status(400).json({ error: "Cannot cancel an order that is already processing or shipped" });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        product.outOfStockSince = null; // reset if restocked
        await product.save();
      }
    }

    order.status = "CANCELLED";
    order.statusHistory.push({
      status: "CANCELLED",
      timestamp: Date.now(),
      note: `Cancelled by ${req.user.role === 'admin' ? 'Admin' : 'Customer'}`
    });

    await order.save();
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Add Courier Integration Log to Order
// @route   POST /api/orders/:id/courier
export const addCourierLog = async (req, res) => {
  try {
    const { courierName, trackingId, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.courierLogs.push({
      courierName,
      trackingId,
      status: "Shipped via Courier",
      note,
      timestamp: Date.now()
    });
    
    // Automatically update status to SHIPPED if it isn't
    if (order.status !== "SHIPPED") {
      order.status = "SHIPPED";
      order.statusHistory.push({
        status: "SHIPPED",
        timestamp: Date.now(),
        note: `Handed over to ${courierName}`
      });
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note, priority } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (status) {
        order.status = status;
        order.statusHistory.push({
            status,
            timestamp: Date.now(),
            note: note || "Status updated by admin"
        });
    }
    
    if (priority) {
        order.priority = priority;
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};
