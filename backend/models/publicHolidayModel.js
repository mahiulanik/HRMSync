import mongoose from "mongoose";

const publicHolidaySchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true }
    },
    { timestamps: true, versionKey: false }
);

const PublicHoliday = mongoose.models.PublicHoliday || mongoose.model("PublicHoliday", publicHolidaySchema);

export default PublicHoliday;
