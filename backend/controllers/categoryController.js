import Category from "../models/Category.js";

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({}).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        res.status(500).json({ error: "Server Error: Could not fetch categories" });
    }
};

// @desc    Get complete category by matching exact name
// @route   GET /api/categories/:name
// @access  Public
export const getCategoryByName = async (req, res) => {
    try {
        // Decode the URI component since it might have spaces or special chars
        const name = decodeURIComponent(req.params.name);

        // Find using a case-insensitive regex match for robustness
        const category = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });

        if (category) {
            res.json(category);
        } else {
            res.status(404).json({ error: "Category not found" });
        }
    } catch (error) {
        console.error("Error fetching category:", error);
        res.status(500).json({ error: "Server Error: Could not fetch category" });
    }
}

// @desc    Add a new category
// @route   POST /api/categories/add
// @access  Private/Admin
export const addCategory = async (req, res) => {
    try {
        const { name, description, image } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Category name is required" });
        }

        const categoryExists = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });

        if (categoryExists) {
            return res.status(400).json({ error: "Category already exists" });
        }

        const category = new Category({
            name,
            description: description || "",
            image: image || "",
        });

        const createdCategory = await category.save();
        res.status(201).json(createdCategory);
    } catch (error) {
        console.error("Error adding category:", error);
        res.status(500).json({ error: "Server Error: Could not add category" });
    }
};

// @desc    Delete a category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ error: "Category not found" });
        }

        await Category.deleteOne({ _id: category._id });
        res.json({ message: "Category removed" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ error: "Server Error: Could not delete category" });
    }
};
