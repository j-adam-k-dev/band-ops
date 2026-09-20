import mongoose from 'mongoose';

// Gear lists vary wildly by member and instrument, with no shared schema across the band.
const rigConfigSchema = new mongoose.Schema(
  {
    memberId: { type: String, required: true, index: true }, // references core-api's Member.id
    instrument: { type: String, required: true },
    gearList: [{ type: String }],
    signalChain: [{ type: String }],
  },
  { timestamps: true }
);

export const RigConfig = mongoose.model('RigConfig', rigConfigSchema, 'rig_configs');
