import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, checklistsTable, homestaysTable } from "@workspace/db";
import {
  GetHomestayChecklistParams,
  GetHomestayChecklistResponse,
  SaveHomestayChecklistParams,
  SaveHomestayChecklistBody,
  SaveHomestayChecklistResponse,
} from "@workspace/api-zod";
import {
  computeScore,
  defaultChecklistItems,
  mergeChecklist,
} from "../lib/checklist";

const router: IRouter = Router();

router.get(
  "/homestays/:id/checklist",
  async (req, res): Promise<void> => {
    const params = GetHomestayChecklistParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [row] = await db
      .select()
      .from(checklistsTable)
      .where(eq(checklistsTable.homestayId, params.data.id));

    if (!row) {
      const items = defaultChecklistItems();
      res.json(
        GetHomestayChecklistResponse.parse({
          homestayId: params.data.id,
          items,
          score: 0,
          updatedAt: new Date().toISOString(),
        }),
      );
      return;
    }

    res.json(
      GetHomestayChecklistResponse.parse({
        homestayId: row.homestayId,
        items: row.items,
        score: row.score,
        updatedAt: row.updatedAt.toISOString(),
      }),
    );
  },
);

router.put(
  "/homestays/:id/checklist",
  async (req, res): Promise<void> => {
    const params = SaveHomestayChecklistParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const body = SaveHomestayChecklistBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    // Ensure homestay exists
    const [homestay] = await db
      .select({ id: homestaysTable.id })
      .from(homestaysTable)
      .where(eq(homestaysTable.id, params.data.id));
    if (!homestay) {
      res.status(404).json({ error: "Homestay not found" });
      return;
    }

    const merged = mergeChecklist(body.data.items);
    const score = computeScore(merged);
    const now = new Date();

    await db
      .insert(checklistsTable)
      .values({
        homestayId: params.data.id,
        items: merged,
        score,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: checklistsTable.homestayId,
        set: { items: merged, score, updatedAt: now },
      });

    res.json(
      SaveHomestayChecklistResponse.parse({
        homestayId: params.data.id,
        items: merged,
        score,
        updatedAt: now.toISOString(),
      }),
    );
  },
);

export default router;
