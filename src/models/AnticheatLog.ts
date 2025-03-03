import mongoose, { Schema, Document } from 'mongoose';

export interface IAnticheatLog extends Document {
    checkName: string;
    checkType: string;
    violation: number;
    experimental: boolean;
    checkData: string;
    extraDebug?: string;
    date: Date;
    playerName: string;
    uuid: string;
}

const AnticheatLogSchema = new Schema({
    checkName: { type: String, required: true },
    checkType: { type: String, required: true },
    violation: { type: Number, required: true },
    experimental: { type: Boolean, default: false },
    checkData: { type: String, required: true },
    extraDebug: String,
    date: { type: Date, default: Date.now },
    playerName: { type: String, required: true, index: true },
    uuid: { type: String, required: true, index: true }
}, {
    collection: 'anticheat_logs'
});

// Add text index for better searching
AnticheatLogSchema.index({ checkData: 'text' });

export default mongoose.model<IAnticheatLog>('AnticheatLog', AnticheatLogSchema); 