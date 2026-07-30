import { Schema, models, model, type InferSchemaType } from "mongoose";

const StructuredJobSchema = new Schema(
  {
    title: { type: String, default: "" },
    company: { type: String, default: "" },
    requiredSkills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    education: { type: String, default: "" },
    certifications: { type: [String], default: [] },
    experience: { type: String, default: "" },
    responsibilities: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    atsPhrases: { type: [String], default: [] },
  },
  { _id: false }
);

const JobInputSchema = new Schema(
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
      default: null,
      index: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    structured: {
      type: StructuredJobSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

export type JobInputFields = InferSchemaType<typeof JobInputSchema>;

export const JobInput = models.JobInput || model("JobInput", JobInputSchema);
