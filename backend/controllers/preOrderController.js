import PreOrder from "../models/PreOrder.js";
import Shipment from "../models/Shipment.js";
import Product from "../models/Product.js";

// @desc    Create a new pre-order
// @route   POST /api/preorders
// @access  Private (Customer)
export const createPreOrder = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Verify product exists and is a pre-order product OR is out of stock
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        if (!product.isPreOrder && product.stock > 0) {
            return res.status(400).json({ error: "This product is in stock and does not need to be pre-ordered." });
        }

        const preOrder = new PreOrder({
            user: req.user._id, // Set by protect middleware
            product: productId,
            quantity: quantity || 1,
        });

        const savedPreOrder = await preOrder.save();

        // Populate product details for response
        await savedPreOrder.populate("product", "name image retailPrice");

        res.status(201).json(savedPreOrder);
    } catch (error) {
        console.error("Error creating pre-order:", error);
        res.status(500).json({ error: "Failed to create pre-order" });
    }
};

// @desc    Get user's own pre-orders
// @route   GET /api/preorders/my
// @access  Private (Customer)
export const getUserPreOrders = async (req, res) => {
    try {
        const preOrders = await PreOrder.find({ user: req.user._id })
            .populate("product", "name image retailPrice")
            .populate("shipment", "baseEstimatedArrival delayInDays status finalETA shipmentBatchId")
            .sort({ createdAt: -1 });

        res.json(preOrders);
    } catch (error) {
        console.error("Error fetching user pre-orders:", error);
        res.status(500).json({ error: "Failed to fetch pre-orders" });
    }
};

// @desc    Get all pre-orders (Admin interface)
// @route   GET /api/preorders
// @access  Private/Admin
export const getAllPreOrders = async (req, res) => {
    try {
        const preOrders = await PreOrder.find({})
            .populate("user", "name email")
            .populate("product", "name image")
            .populate("shipment", "shipmentBatchId finalETA")
            .sort({ createdAt: -1 });

        res.json(preOrders);
    } catch (error) {
        console.error("Error fetching all pre-orders:", error);
        res.status(500).json({ error: "Failed to fetch all pre-orders" });
    }
};

// @desc    Update pre-order status or details
// @route   PUT /api/preorders/:id
// @access  Private/Admin
export const updatePreOrderStatus = async (req, res) => {
    try {
        const { status, shipmentId, estimatedArrival, note } = req.body;
        const preOrder = await PreOrder.findById(req.params.id);

        if (!preOrder) {
            return res.status(404).json({ error: "Pre-order not found" });
        }

        let statusUpdated = false;

        // Check if status is changing legally
        if (status && status !== preOrder.status) {
            preOrder.status = status;
            statusUpdated = true;

            // Push to history
            preOrder.statusHistory.push({
                status: status,
                timestamp: Date.now(),
                note: note || `Status updated to ${status} by Admin`,
            });

            // AUTO-GENERATE SHIPMENT when approving if none exists
            if (status === 'APPROVED' && !preOrder.shipment) {
                const newBatchId = `AUTO-CN-${Date.now().toString().slice(-6)}`;
                const autoEta = new Date();
                autoEta.setDate(autoEta.getDate() + 14); // Default 14 days out

                const newShipment = new Shipment({
                    shipmentBatchId: newBatchId,
                    origin: "China",
                    destination: "Bangladesh",
                    baseEstimatedArrival: autoEta,
                    status: "IN_TRANSIT"
                });
                await newShipment.save();

                preOrder.shipment = newShipment._id;
                preOrder.statusHistory.push({
                    status: 'APPROVED',
                    timestamp: Date.now(),
                    note: `Automatically linked to auto-generated shipment batch: ${newBatchId}`
                });
            }
        }

        // Handle shipment linking (separate from status update)
        if (shipmentId !== undefined) {
            preOrder.shipment = shipmentId || null;
            if (shipmentId) {
                preOrder.statusHistory.push({
                    status: preOrder.status,
                    timestamp: Date.now(),
                    note: `Linked to Shipment: ${shipmentId}`,
                });
            }
        }

        if (estimatedArrival !== undefined) {
            preOrder.estimatedArrival = estimatedArrival;
        }

        const updatedPreOrder = await preOrder.save();
        await updatedPreOrder.populate("user", "name email");
        await updatedPreOrder.populate("product", "name image");
        await updatedPreOrder.populate("shipment", "shipmentBatchId finalETA");

        res.json(updatedPreOrder);
    } catch (error) {
        console.error("Error updating pre-order:", error);
        res.status(500).json({ error: "Failed to update pre-order" });
    }
};

// @desc    Update pre-order quantity (only for PENDING orders)
// @route   PUT /api/preorders/:id/quantity
// @access  Private
export const updatePreOrderQuantity = async (req, res) => {
    try {
        const { quantity } = req.body;
        const preOrder = await PreOrder.findById(req.params.id);

        if (!preOrder) {
            return res.status(404).json({ error: "Pre-order not found" });
        }

        // Only allow updating quantity for PENDING orders by the owner or admin
        if (preOrder.status !== 'PENDING') {
            return res.status(400).json({ error: "Can only update quantity for PENDING pre-orders" });
        }

        // Check authorization (owner or admin)
        if (req.user._id.toString() !== preOrder.user.toString() && !req.user.isAdmin) {
            return res.status(403).json({ error: "Not authorized to update this pre-order" });
        }

        // Validate quantity
        if (!quantity || quantity < 1) {
            return res.status(400).json({ error: "Quantity must be at least 1" });
        }

        preOrder.quantity = quantity;
        preOrder.statusHistory.push({
            status: 'PENDING',
            timestamp: Date.now(),
            note: `Quantity updated to ${quantity}`,
        });

        const updatedPreOrder = await preOrder.save();
        await updatedPreOrder.populate("product", "name image retailPrice");

        res.json(updatedPreOrder);
    } catch (error) {
        console.error("Error updating pre-order quantity:", error);
        res.status(500).json({ error: "Failed to update pre-order quantity" });
    }
};

// @desc    Cancel a pre-order (only for PENDING orders)
// @route   DELETE /api/preorders/:id
// @access  Private
export const cancelPreOrder = async (req, res) => {
    try {
        const preOrder = await PreOrder.findById(req.params.id);

        if (!preOrder) {
            return res.status(404).json({ error: "Pre-order not found" });
        }

        // Only allow cancelling PENDING orders by the owner or admin
        if (preOrder.status !== 'PENDING') {
            return res.status(400).json({ error: "Can only cancel PENDING pre-orders" });
        }

        // Check authorization (owner or admin)
        if (req.user._id.toString() !== preOrder.user.toString() && !req.user.isAdmin) {
            return res.status(403).json({ error: "Not authorized to cancel this pre-order" });
        }

        // Record cancellation in history before saving
        preOrder.status = 'CANCELLED';
        preOrder.statusHistory.push({
            status: 'CANCELLED',
            timestamp: Date.now(),
            note: 'Pre-order cancelled by customer',
        });

        await preOrder.save();

        res.json({ message: "Pre-order cancelled successfully", preOrder });
    } catch (error) {
        console.error("Error cancelling pre-order:", error);
        res.status(500).json({ error: "Failed to cancel pre-order" });
    }
};

// @desc    Delete a cancelled pre-order (customer only)
// @route   DELETE /api/preorders/:id/remove
// @access  Private
export const deletePreOrder = async (req, res) => {
    try {
        const preOrder = await PreOrder.findById(req.params.id);

        if (!preOrder) {
            return res.status(404).json({ error: "Pre-order not found" });
        }

        // Only owner or admin can delete
        if (req.user._id.toString() !== preOrder.user.toString() && !req.user.isAdmin) {
            return res.status(403).json({ error: "Not authorized to remove this pre-order" });
        }

        // Only allow deletion if already cancelled
        if (preOrder.status !== 'CANCELLED') {
            return res.status(400).json({ error: "Only cancelled pre-orders can be removed" });
        }

        await preOrder.deleteOne();
        res.json({ message: "Pre-order removed" });
    } catch (error) {
        console.error("Error deleting pre-order:", error);
        res.status(500).json({ error: "Failed to delete pre-order" });
    }
};
