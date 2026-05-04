import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

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

    if (order.status !== "PENDING" && req.user.role !== "admin") {
      return res.status(400).json({ error: "Cannot cancel an order that is already processing or shipped" });
    }

    // Restore stock
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        product.outOfStockSince = null;
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

// @desc    Update order status (and credit loyalty points when delivered)
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note, priority } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    const previousStatus = order.status;

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

    // **** NEW: Loyalty points credit on delivery ****
    if (status === 'DELIVERED' && previousStatus !== 'DELIVERED') {
      const user = await User.findById(order.user);
      if (user) {
        const pointsEarned = Math.floor(order.totalAmount / 100); // 1 point per ৳100
        user.loyaltyPoints += pointsEarned;
        user.totalSpent += order.totalAmount;
        
        // Auto‑recalculate membership tier
        if (user.loyaltyPoints >= 10000) user.membershipTier = 'Platinum';
        else if (user.loyaltyPoints >= 5000) user.membershipTier = 'Gold';
        else if (user.loyaltyPoints >= 2000) user.membershipTier = 'Silver';
        else user.membershipTier = 'Basic';
        
        await user.save();
      }
    }

    await order.save();
    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get total revenue analytics (with date range & grouping)
// @route   GET /api/orders/revenue?startDate=&endDate=&groupBy=day|month|none
export const getTotalRevenue = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const filter = { status: "DELIVERED" };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Grouped aggregation (day / month)
    if (groupBy === 'day' || groupBy === 'month') {
      const groupId = groupBy === 'day'
        ? { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
        : { $dateToString: { format: "%Y-%m", date: "$createdAt" } };

      const pipeline = [
        { $match: filter },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "productInfo"
          }
        },
        { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            itemProfit: {
              $multiply: [
                { $subtract: ["$items.price", { $ifNull: ["$productInfo.importCost", 0] }] },
                "$items.quantity"
              ]
            }
          }
        },
        {
          $group: {
            _id: { orderId: "$_id", period: groupId },
            orderTotal: { $first: "$totalAmount" },
            orderProfit: { $sum: "$itemProfit" }
          }
        },
        {
          $group: {
            _id: "$_id.period",
            totalRevenue: { $sum: "$orderTotal" },
            totalProfit: { $sum: "$orderProfit" },
            orderCount: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            period: "$_id",
            totalRevenue: 1,
            totalProfit: 1,
            orderCount: 1
          }
        },
        { $sort: { period: 1 } }
      ];

      const aggregated = await Order.aggregate(pipeline);
      return res.json(aggregated);
    }

    // No grouping – simple totals
    const orders = await Order.find(filter).populate('items.product');
    
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
    
    const totalProfit = orders.reduce((acc, order) => {
      const orderProfit = order.items.reduce((sum, item) => {
        const cost = item.product?.importCost || 0;
        return sum + (item.price - cost) * item.quantity;
      }, 0);
      return acc + orderProfit;
    }, 0);

    res.json({ 
      totalRevenue, 
      totalProfit, 
      orderCount: orders.length,
      margin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0.0'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};