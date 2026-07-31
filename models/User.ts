import {
  Schema,
  models,
  model,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    dailyAllowance: {
      type: Number,
      default: 2,
      min: 0,
    },
    usesUsedToday: {
      type: Number,
      default: 0,
      min: 0,
    },
    usageDate: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export type UserFields = InferSchemaType<typeof UserSchema>;
export type UserDocument = HydratedDocument<UserFields>;

export const User = models.User || model("User", UserSchema);
