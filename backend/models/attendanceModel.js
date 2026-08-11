import mongoose from "mongoose";


const attendanceSchema = new mongoose.Schema({
    employeeId: {type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true},
    shiftId: {type: mongoose.Schema.Types.ObjectId, ref: "Shift", required: false},
    date: {type: Date, required: true},
    checkIn: {type: Date, default: null},
    checkOut: {type: Date, default: null},
    status: {type: String, enum: ["PRESENT", "ABSENT", "LATE"], default: "ABSENT"},
    lateMinutes: {type: Number,default: 0},
    earlyLeaveMinutes: {type: Number,default: 0},
    overtimeMinutes: {type: Number,default: 0},
    workingHours: {type: Number, default: null},
    dayType: {type: String, enum: ["Full Day", "Half Day", null], default: null}
}, {timestamps: true, versionKey: false})

attendanceSchema.index({employeeId: 1, date: 1}, {unique: true})

const Attendance = mongoose.model("Attendance", attendanceSchema)

export default Attendance