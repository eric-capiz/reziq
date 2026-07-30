import { Schema, models, model, type InferSchemaType } from "mongoose";

const ExportSchema = new Schema(
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
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: "Analysis",
      default: null,
    },
    format: {
      type: String,
      enum: ["docx", "pdf"],
      required: true,
    },
    source: {
      type: String,
      enum: ["structuredDraft", "structured"],
      required: true,
    },
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    filename: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

export type ExportFields = InferSchemaType<typeof ExportSchema>;

export const ExportRecord =
  models.ExportRecord || model("ExportRecord", ExportSchema);
