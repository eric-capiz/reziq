import { Schema, models, model, type InferSchemaType } from "mongoose";

const ContactSchema = new Schema(
  {
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    links: { type: [String], default: [] },
  },
  { _id: false }
);

const ExperienceItemSchema = new Schema(
  {
    company: { type: String, default: "" },
    title: { type: String, default: "" },
    location: { type: String, default: "" },
    dates: { type: String, default: "" },
    bullets: { type: [String], default: [] },
  },
  { _id: false }
);

const EducationItemSchema = new Schema(
  {
    school: { type: String, default: "" },
    degree: { type: String, default: "" },
    year: { type: String, default: "" },
    details: { type: String, default: "" },
  },
  { _id: false }
);

const OtherSectionSchema = new Schema(
  {
    title: { type: String, default: "" },
    content: { type: String, default: "" },
  },
  { _id: false }
);

const StructuredResumeSchema = new Schema(
  {
    contact: { type: ContactSchema, default: () => ({}) },
    summary: { type: String, default: "" },
    experience: { type: [ExperienceItemSchema], default: [] },
    education: { type: [EducationItemSchema], default: [] },
    skills: { type: [String], default: [] },
    otherSections: { type: [OtherSectionSchema], default: [] },
  },
  { _id: false }
);

const ResumeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
    rawText: {
      type: String,
      default: "",
    },
    structured: {
      type: StructuredResumeSchema,
      default: () => ({}),
    },
    structuredDraft: {
      type: StructuredResumeSchema,
      required: false,
    },
    status: {
      type: String,
      enum: ["uploaded", "extracted", "error"],
      default: "uploaded",
    },
    extractionError: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export type ResumeFields = InferSchemaType<typeof ResumeSchema>;

export const Resume = models.Resume || model("Resume", ResumeSchema);
