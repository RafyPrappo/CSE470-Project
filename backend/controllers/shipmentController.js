import Shipment from "../models/Shipment.js";
import PreOrder from "../models/PreOrder.js"; // to cascade status updates

// @desc    Create a new shipment batch
// @route   POST /api/shipments
// @access  Private/Admin
export const createShipment = async (req, res) => {
    try {
        const { shipmentBatchId, origin, destination, baseEstimatedArrival, status } = req.body;

        if (!shipmentBatchId || !baseEstimatedArrival) {
            return res.status(400).json({ error: "Batch ID and Base Estimated Arrival are required" });
        }

        const shipmentExists = await Shipment.findOne({ shipmentBatchId });
        if (shipmentExists) {
            return res.status(400).json({ error: "Shipment batch ID already exists" });
        }

        const shipment = new Shipment({
            shipmentBatchId,
            origin: origin || 'China',
            destination: destination || 'Bangladesh',
            baseEstimatedArrival,
            status: status || 'PROCESSING',
        });

        const createdShipment = await shipment.save();
        res.status(201).json(createdShipment);
    } catch (error) {
        console.error("Error creating shipment:", error);
        res.status(500).json({ error: "Failed to create shipment" });
    }
};

// @desc    Get all shipments
// @route   GET /api/shipments
// @access  Private/Admin
export const getAllShipments = async (req, res) => {
    try {
        const shipments = await Shipment.find({}).sort({ createdAt: -1 });
        res.json(shipments);
    } catch (error) {
        console.error("Error fetching shipments:", error);
        res.status(500).json({ error: "Failed to fetch shipments" });
    }
};

// @desc    Update shipment details (Delay, status)
// @route   PUT /api/shipments/:id
// @access  Private/Admin
export const updateShipment = async (req, res) => {
    try {
        const { status, delayInDays, departureDate } = req.body;
        const shipment = await Shipment.findById(req.params.id);

        if (!shipment) {
            return res.status(404).json({ error: "Shipment not found" });
        }

        if (status) shipment.status = status;
        if (delayInDays !== undefined) shipment.delayInDays = delayInDays;
        if (departureDate) shipment.departureDate = departureDate;

        // If Admin explicitly changes the date via calendar, reset delay and override base date
        if (req.body.baseEstimatedArrival) {
            shipment.baseEstimatedArrival = req.body.baseEstimatedArrival;
            shipment.delayInDays = 0;
        }

        const updatedShipment = await shipment.save();
        // If status change should cascade to pre-orders
        if (status) {
            if (status === 'SHIPPED') {
                await PreOrder.updateMany(
                    { shipment: shipment._id, status: 'APPROVED' },
                    { $set: { status: 'SHIPPED' }, $push: { statusHistory: { status: 'SHIPPED', timestamp: Date.now(), note: 'Shipment marked as SHIPPED' } } }
                );
            }
            if (['DELIVERED','LOCAL_HUB','CUSTOMS'].includes(status)) {
                await PreOrder.updateMany(
                    { shipment: shipment._id, status: { $in: ['SHIPPED','APPROVED'] } },
                    { $set: { status: 'DELIVERED' }, $push: { statusHistory: { status: 'DELIVERED', timestamp: Date.now(), note: 'Shipment marked as DELIVERED' } } }
                );
            }
        }
        res.json(updatedShipment);
    } catch (error) {
        console.error("Error updating shipment:", error);
        res.status(500).json({ error: "Failed to update shipment details" });
    }
};
