import {
  Schema,
  models,
  model,
  type InferSchemaType,
  type Model,
} from "mongoose";

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
    title: {
      type: String,
      default: "",
      trim: true,
    },
    postingTitle: {
      type: String,
      default: "",
      trim: true,
    },
    postingCompany: {
      type: String,
      default: "",
      trim: true,
    },
    postingUrl: {
      type: String,
      default: "",
      trim: true,
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

function ensurePostingPaths(resumeModel: Model<ResumeFields>) {
  if (!resumeModel.schema.path("postingTitle")) {
    resumeModel.schema.add({
      postingTitle: { type: String, default: "", trim: true },
      postingCompany: { type: String, default: "", trim: true },
      postingUrl: { type: String, default: "", trim: true },
    });
  }
}

export const Resume: Model<ResumeFields> = (() => {
  const resumeModel =
    (models.Resume as Model<ResumeFields> | undefined) ??
    model<ResumeFields>("Resume", ResumeSchema);
  ensurePostingPaths(resumeModel);
  return resumeModel;
})();

