import mongoose from 'mongoose';

const checklistItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

// Outdoor shows need banner-stabilization and weather items that indoor shows never do —
// the checklist shape depends on context, not a fixed column set.
const gigChecklistSchema = new mongoose.Schema(
  {
    gigId: { type: String, required: true, index: true }, // references core-api's Gig.id
    venueType: { type: String, enum: ['indoor', 'outdoor'], required: true },
    items: [checklistItemSchema],
    notes: { type: String },
  },
  { timestamps: true }
);

export const GigChecklist = mongoose.model('GigChecklist', gigChecklistSchema, 'gig_checklists');
