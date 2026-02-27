import mongoose from "mongoose";

const shipmentSchema = new mongoose.Schema({
  shipmentBatchId: { type: String, required: true, unique: true },
  origin: { type: String, default: 'China' },
  destination: { type: String, default: 'Bangladesh' },
  status: {
    type: String,
    enum: ['PROCESSING', 'SHIPPED', 'CUSTOMS', 'LOCAL_HUB', 'DELIVERED'],
    default: 'PROCESSING'
  },
  departureDate: { type: Date },
  baseEstimatedArrival: { type: Date, required: true }, // Initial estimate made by admin
  delayInDays: { type: Number, default: 0 }, // Dynamically update this if delayed
  productsIncluded: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true }
  }]
}, { timestamps: true });

// Virtual property to calculate final ETA
shipmentSchema.virtual('finalETA').get(function () {
  const eta = new Date(this.baseEstimatedArrival);
  eta.setDate(eta.getDate() + this.delayInDays);
  return eta;
});

// Ensure virtuals are included in JSON responses
shipmentSchema.set('toJSON', { virtuals: true });
shipmentSchema.set('toObject', { virtuals: true });

const Shipment = mongoose.model('Shipment', shipmentSchema);
export default Shipment;
