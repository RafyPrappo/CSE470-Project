import User from "../models/User.js";

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
