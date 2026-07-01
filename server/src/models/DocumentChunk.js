import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    documentId: { type: String, required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    tokenCountApprox: { type: Number, default: 0 },
    embedding: { type: [Number], default: [] },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

documentChunkSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);
