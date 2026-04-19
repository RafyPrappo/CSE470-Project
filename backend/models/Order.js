import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: String,
      quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
      },
      price: {
        type: Number,
        required: true,
      }
    }
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  shippingAddress: {
    label: String,
    street: String,
    city: String,
    postalCode: String,
    phone: String,
  },
  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
    default: "PENDING",
  },
  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH"],
    default: "MEDIUM",
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  suggestedCourier: {
    type: String,
    default: 'SteadFast'
  },
  statusHistory: [
    {
      status: {
        type: String,
        enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      note: String,
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
orderSchema.pre("save", function (next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: Date.now(),
      note: "Order placed by customer",
    });
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
