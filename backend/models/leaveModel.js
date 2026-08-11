import mongoose from "mongoose";


const leaveSchema = new mongoose.Schema({
    employeeId: {type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true},
    type: {type: String, enum: ["SICK", "CASUAL", "EARNED"], required: true},
    startDate: {type: Date, required: true},
    endDate: {type: Date, required: true},
    reason: {type: String, required: true},
    status: {type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING"}
}, {timestamps: true, versionKey: false})

const Leave = mongoose.models.Leave || mongoose.model("Leave", leaveSchema)

export default Leave