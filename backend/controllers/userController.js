import User from "../models/User.js";
import Order from "../models/Order.js";

// @desc    Add a new address to user profile
// @route   POST /api/users/addresses
export const addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const newAddress = {
      label: req.body.label || "Home",
      street: req.body.street,
      city: req.body.city,
      postalCode: req.body.postalCode,
      phone: req.body.phone,
      isDefault: req.body.isDefault || false
    };

    if (!newAddress.street || !newAddress.city || !newAddress.postalCode || !newAddress.phone) {
        return res.status(400).json({ error: "Please fill all required address fields" });
    }

    // If this is the first address or set to default, reset others
    if (user.addresses.length === 0) {
        newAddress.isDefault = true;
    } else if (newAddress.isDefault) {
        user.addresses.forEach(a => a.isDefault = false);
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get user addresses
// @route   GET /api/users/addresses
export const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:id
export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    
    // Ensure one default remains if possible
    if (user.addresses.length > 0 && !user.addresses.some(a => a.isDefault)) {
        user.addresses[0].isDefault = true;
    }

    await user.save();
    res.json(user.addresses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get user membership & loyalty info (self)
// @route   GET /api/users/membership
export const getMembership = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('membershipTier loyaltyPoints totalSpent');
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      tier: user.membershipTier,
      points: user.loyaltyPoints,
      totalSpent: user.totalSpent,
      nextTier: getNextTier(user.loyaltyPoints)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Admin: update user membership manually
// @route   PUT /api/users/membership/:id
export const updateMembership = async (req, res) => {
  try {
    const { membershipTier, loyaltyPoints } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (membershipTier) user.membershipTier = membershipTier;
    if (loyaltyPoints !== undefined) {
      user.loyaltyPoints = loyaltyPoints;
      // Auto‑sync membership if admin gave points but not tier
      if (!membershipTier) {
        if (loyaltyPoints >= 10000) user.membershipTier = 'Platinum';
        else if (loyaltyPoints >= 5000) user.membershipTier = 'Gold';
        else if (loyaltyPoints >= 2000) user.membershipTier = 'Silver';
        else user.membershipTier = 'Basic';
      }
    }

    await user.save();
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      membershipTier: user.membershipTier,
      loyaltyPoints: user.loyaltyPoints,
      totalSpent: user.totalSpent
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Admin: get all users with membership stats
// @route   GET /api/users/members/all
export const getAllMembershipStats = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .select('name email membershipTier loyaltyPoints totalSpent createdAt')
      .sort({ loyaltyPoints: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
};

// Helper: what is the next tier?
function getNextTier(points) {
  if (points < 2000) return { tier: 'Silver', pointsNeeded: 2000 - points };
  if (points < 5000) return { tier: 'Gold', pointsNeeded: 5000 - points };
  if (points < 10000) return { tier: 'Platinum', pointsNeeded: 10000 - points };
  return null; // Max tier
}