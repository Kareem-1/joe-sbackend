import mongoose from "mongoose";

const NewsletterSchema = new mongoose.Schema({
  name: { type: String, required: false },
  number: { type: String, required: true },
});

export default mongoose.model("newsletter", NewsletterSchema);
