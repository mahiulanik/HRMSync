import mongoose from "mongoose";

const publicHolidaySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    { timestamps: true, versionKey: false }
);

publicHolidaySchema.index({ startDate: 1, endDate: 1 });

const PublicHoliday = mongoose.models.PublicHoliday || mongoose.model("PublicHoliday", publicHolidaySchema);

export default PublicHoliday;
