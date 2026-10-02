import { Router, type IRouter } from "express";
import developerRouter from "./developer";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(developerRouter);

export default router;
