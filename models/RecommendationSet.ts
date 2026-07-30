import { Schema, models, model, type InferSchemaType } from "mongoose";

const RecommendationItemSchema = new Schema(
  {
    itemId: { type: String, required: true },
    section: {
      type: String,
      enum: ["summary", "experience", "skills", "education", "other"],
      required: true,
    },
    targetPath: { type: String, required: true },
    title: { type: String, required: true },
    rationale: { type: String, default: "" },
    currentText: { type: String, default: "" },
    proposedText: { type: String, required: true },
    resumeEvidence: { type: String, default: "" },
    decision: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  { _id: false }
);

const RecommendationSetSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: "Analysis",
      required: true,
      unique: true,
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
    alreadyStrong: {
      type: Boolean,
      default: false,
    },
    statusNote: {
      type: String,
      default: "",
    },
    diyAdvice: {
      type: String,
      default: "",
    },
    items: {
      type: [RecommendationItemSchema],
      default: [],
    },
    provider: {
      type: String,
      enum: ["groq", "cerebras", "gemini"],
      required: true,
    },
    appliedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export type RecommendationSetFields = InferSchemaType<
  typeof RecommendationSetSchema
>;

export type RecommendationItemFields = InferSchemaType<
  typeof RecommendationItemSchema
>;

export const RecommendationSet =
  models.RecommendationSet ||
  model("RecommendationSet", RecommendationSetSchema);
