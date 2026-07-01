import mongoose from 'mongoose';

const workflowRunSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    workspaceId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['ask', 'summarize', 'compare', 'meeting_action_items', 'research_brief'],
      required: true
    },
    status: { type: String, enum: ['queued', 'running', 'completed', 'failed'], default: 'queued' },
    title: { type: String, required: true },
    input: { type: Object, default: {} },
    output: { type: Object, default: {} },
    citations: { type: [Object], default: [] },
    evaluation: { type: Object, default: {} },
    trace: { type: [Object], default: [] }
  },
  { timestamps: true }
);

workflowRunSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export const WorkflowRun = mongoose.model('WorkflowRun', workflowRunSchema);
