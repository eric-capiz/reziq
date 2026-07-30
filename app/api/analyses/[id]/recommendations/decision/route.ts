import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  RecommendationSet,
  type RecommendationItemFields,
} from "@/models/RecommendationSet";

const bodySchema = z.object({
  itemId: z.string().min(1),
  decision: z.enum(["pending", "accepted", "rejected"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid decision" }, { status: 400 });
  }

  const { id } = await context.params;
  await connectDB();
  const set = await RecommendationSet.findOne({
    analysisId: id,
    userId: session.user.id,
  });
  if (!set) {
    return NextResponse.json({ error: "Recommendations not found" }, { status: 404 });
  }

  const item = set.items.find(
    (entry: RecommendationItemFields) => entry.itemId === parsed.data.itemId
  );
  if (!item) {
    return NextResponse.json({ error: "Recommendation not found" }, { status: 404 });
  }

  item.decision = parsed.data.decision;
  set.markModified("items");
  await set.save();

  return NextResponse.json({
    itemId: item.itemId,
    decision: item.decision,
    items: set.items,
  });
}
