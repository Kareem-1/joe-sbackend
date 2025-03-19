import express from "express";
import Newsletter from "../models/newsletter.js";

const router = express.Router();

// GET all newsletters
router.get("/", async (req, res) => {
  try {
    const newsletters = await Newsletter.find();
    res.json(newsletters);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE newsletter
router.post("/", async (req, res) => {
  try {
    const newsletter = new Newsletter({
      name: req.body.name,
      number: req.body.number,
    });
    const newNewsletter = await newsletter.save();
    res.status(201).json(newNewsletter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE newsletter
router.put("/:id", async (req, res) => {
  try {
    const updatedNewsletter = await Newsletter.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedNewsletter) {
      return res.status(404).json({ message: "Newsletter entry not found" });
    }
    res.json(updatedNewsletter);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE newsletter
router.delete("/:id", async (req, res) => {
  try {
    const deletedNewsletter = await Newsletter.findByIdAndDelete(req.params.id);
    if (!deletedNewsletter) {
      return res.status(404).json({ message: "Newsletter entry not found" });
    }
    res.json({ message: "Newsletter entry deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
