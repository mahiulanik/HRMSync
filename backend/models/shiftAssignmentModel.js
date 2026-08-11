import mongoose from "mongoose";

const shiftAssignmentSchema = new mongoose.Schema(
    {
        employeeId: {type: mongoose.Schema.Types.ObjectId,ref: "Employee",required: true},
        shiftId: {type: mongoose.Schema.Types.ObjectId,ref: "Shift",required: true},
        date: {type: Date,required: true}
    }, {timestamps: true, versionKey: false},
);

shiftAssignmentSchema.index({employeeId: 1,date: 1},{unique: true})

const ShiftAssignment = mongoose.models.ShiftAssignment || mongoose.model("ShiftAssignment", shiftAssignmentSchema);

export default ShiftAssignment;