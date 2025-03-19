import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    status: { type: String, required: true},
    item: {type: String, required: true},
    customer_name: {type: String, required: true},
    clinic_name: {type: String, required: true},
    phone_number: {type: String, required: true},
    city: {type: String, required: true},
    state: {type: String, required: true},
    additional_details: {type: String}
})

export default mongoose.model("Orders", OrderSchema);
