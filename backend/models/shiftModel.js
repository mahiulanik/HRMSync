import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
    {
        name: {type: String,required: true,unique: true,trim: true},
        startTime: {type: String,required: true},
        endTime: {type: String,required: true},
        graceMinutes: {type: Number,default: 15,min: 0},
        weekends: [{type: Number, enum: [0, 1, 2, 3, 4, 5, 6]}],
        isActive: {type: Boolean,default: true}
    },{timestamps: true, versionKey: false}
);

const Shift = mongoose.models.Shift || mongoose.model("Shift", shiftSchema);

export default Shift;