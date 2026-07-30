import { Schema, models, model, type InferSchemaType } from "mongoose";

const AiProviderDailySchema = new Schema(
  {
    provider: {
      type: String,
      enum: ["groq", "cerebras", "gemini"],
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    requests: {
      type: Number,
      default: 0,
      min: 0,
    },
    tokensIn: {
      type: Number,
      default: 0,
      min: 0,
    },
    tokensOut: {
      type: Number,
      default: 0,
      min: 0,
    },
    exhausted: {
      type: Boolean,
      default: false,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
    lastError: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

AiProviderDailySchema.index({ provider: 1, date: 1 }, { unique: true });

export type AiProviderDailyDocument = InferSchemaType<
  typeof AiProviderDailySchema
> & {
  _id: Schema.Types.ObjectId;
};

export const AiProviderDaily =
  models.AiProviderDaily || model("AiProviderDaily", AiProviderDailySchema);
