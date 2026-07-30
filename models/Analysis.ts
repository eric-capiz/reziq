import { Schema, models, model, type InferSchemaType } from "mongoose";

const EvidenceSchema = new Schema(
  {
    label: { type: String, default: "" },
    detail: { type: String, default: "" },
    resumeEvidence: { type: String, default: "" },
    jobEvidence: { type: String, default: "" },
  },
  { _id: false }
);

const AnalysisSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "JobInput",
      required: true,
      index: true,
    },
    verdict: {
      type: String,
      enum: ["strong", "possible", "poor"],
      required: true,
    },
    summary: {
      type: String,
      default: "",
    },
    matches: {
      type: [EvidenceSchema],
      default: [],
    },
    partialMatches: {
      type: [EvidenceSchema],
      default: [],
    },
    gaps: {
      type: [EvidenceSchema],
      default: [],
    },
    guidance: {
      type: String,
      default: "",
    },
    provider: {
      type: String,
      enum: ["groq", "cerebras", "gemini"],
      required: true,
    },
    cached: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

AnalysisSchema.index({ userId: 1, resumeId: 1, jobId: 1 }, { unique: true });

export type AnalysisFields = InferSchemaType<typeof AnalysisSchema>;

export const Analysis = models.Analysis || model("Analysis", AnalysisSchema);
