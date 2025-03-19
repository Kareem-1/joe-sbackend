import express from "express";
import Reviews from "../models/reviews.js";

const router = express.Router();

// GET all reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Reviews.find();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE review
router.post("/", async (req, res) => {
  try {
    const review = new Reviews({
      name: req.body.name,
      review: req.body.review,
      date: req.body.date,
      rating: req.body.rating,
      confirm: req.body.confirm,
    });
    const newReview = await review.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// UPDATE review
router.put("/:id", async (req, res) => {
  try {
    const updatedReview = await Reviews.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json(updatedReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE review
router.delete("/:id", async (req, res) => {
  try {
    const deletedReview = await Reviews.findByIdAndDelete(req.params.id);
    if (!deletedReview) {
      return res.status(404).json({ message: "Review not found" });
    }
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
