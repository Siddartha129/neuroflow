import mongoose from 'mongoose';

const chatThreadSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    title: { type: String, required: true }
  },
  { timestamps: true }
);

chatThreadSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const ChatThread = mongoose.model('ChatThread', chatThreadSchema);
