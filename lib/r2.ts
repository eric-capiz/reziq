import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: requiredEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });
}

export function getR2Bucket() {
  return requiredEnv("R2_BUCKET_NAME");
}

export async function uploadResumeObject(input: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getR2Bucket(),
      Key: input.key,
      Body: input.body,
      ContentType: input.contentType,
    })
  );
  return input.key;
}

export async function deleteResumeObject(key: string) {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    })
  );
}

export async function getResumeObjectBuffer(key: string) {
  const client = getR2Client();
  const result = await client.send(
    new GetObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    })
  );
  const bytes = await result.Body?.transformToByteArray();
  if (!bytes) {
    throw new Error("Empty object body");
  }
  return Buffer.from(bytes);
}
