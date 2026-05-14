import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
    adminId: { type: String, required: true },
    accion: { type: String, required: true },
    endpoint: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed },
    direccionIp: { type: String }
}, {
    timestamps: true
});

export default mongoose.model('AuditLog', auditSchema);