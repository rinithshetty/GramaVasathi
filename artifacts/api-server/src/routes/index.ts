import { Router, type IRouter } from "express";
import healthRouter from "./health";
import homestaysRouter from "./homestays";
import bookingsRouter from "./bookings";
import checklistRouter from "./checklist";
import insightsRouter from "./insights";

const router: IRouter = Router();

router.use(healthRouter);
router.use(homestaysRouter);
router.use(bookingsRouter);
router.use(checklistRouter);
router.use(insightsRouter);

export default router;
