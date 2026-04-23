import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    nombres: { type: String, required: true },
    apellidos: { type: String, required: true },
    dpi: { type: String, required: true, unique: true, length: 13 },
    fechaNacimiento: { type: Date, required: true },
    direccion: { type: String, required: true },
    telefono: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    fotoDpiUrl: { type: String },
    ingresosMensuales: { type: Number, default: 0 },
    estado: { 
        type: String, 
        enum: ['Activo', 'Suspendido', 'En Verificacion'], 
        default: 'En Verificacion' 
    },
    rol: { 
        type: String, 
        enum: ['Cliente', 'Administrador'], 
        default: 'Cliente' 
    }
}, {
    timestamps: true
});

export default mongoose.model('User', userSchema);