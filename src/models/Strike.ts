import { Schema, model } from 'mongoose';

const strikeSchema = new Schema({
    userId: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    reasons: { type: [String], default: [] }
});

const Strike = model('StaffStrikes', strikeSchema);

export default Strike; 