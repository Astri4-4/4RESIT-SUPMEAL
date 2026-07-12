import { Router } from "express";

const router = Router();

// Create a new recipe
router.post("/", async (req, res) => {
    const recipe = req.body;
    // Logic to create a new recipe in the database
    res.status(201).json({ message: "Recipe created successfully", recipe });
});

export default router;