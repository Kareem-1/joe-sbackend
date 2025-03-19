import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
    name: { type: String, required: true},
    review: { type: String, required: true},
    date: { type: String, required: true},
    rating: { type: Number, required: true},
    confirm: { type: Boolean, required: true}
})

export default mongoose.model("Reviews", ReviewSchema);
