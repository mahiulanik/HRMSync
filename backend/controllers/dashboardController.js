import * as dashboardService from "../services/dashboardService.js";

export const getDashboard = async (req, res) => {
    try {
        const result = await dashboardService.getDashboard(req.session);
        return res.status(200).json(result);

    } catch (error) {
        return res.status(error.statusCode || 500).json({
            success: false,
            error: error.message || "Internal Server Error"
        });
    }
};