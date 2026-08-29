import * as dashboardService from "../services/dashboardService.js";
import asyncHandler from "../middlewares/asyncHandler.js";

export const getDashboard = asyncHandler(async (req, res) => {
    const result = await dashboardService.getDashboard(req.session);

    return res.status(200).json(result);
});