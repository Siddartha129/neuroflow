import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    threadId: { type: String, required: true, index: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    citations: { type: [Object], default: [] }
  },
  { timestamps: true }
);

chatMessageSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
