import mongoose from "mongoose";

const preOrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
    default: 1,
  },
  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "SHIPPED", "DELIVERED", "CANCELLED"],
    default: "PENDING",
  },
  estimatedArrival: {
    type: Date, // Optional override set by admin
  },
  shipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shipment",
  },
  statusHistory: [
    {
      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "SHIPPED", "DELIVERED", "CANCELLED"],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      note: {
        type: String, // E.g., "Approved by admin" or "Linked to Shipment BATCH-123"
      },
    },
  ],
  courierLogs: [
    {
      courierName: String,
      trackingId: String,
      status: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      note: String,
    }
  ]
}, { timestamps: true });

// Ensure history logs the initial PENDING status on creation
preOrderSchema.pre("save", function (next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: Date.now(),
      note: "Pre-order placed by customer",
    });
  }
  next();
});

const PreOrder = mongoose.model("PreOrder", preOrderSchema);
export default PreOrder;
