import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    nombres: { type: String, required: true },
    apellidos: { type: String, required: true },
    dpi: { type: String, required: true, unique: true, length: 13 },
    fechaNacimiento: { type: Date, required: true },
    
    direccion: {
        departamento: { type: String, required: true },
        municipio: { type: String, required: true },
        zona: { type: String, required: true },
        detalle: { type: String, required: true }
    },
    
    telefono: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    
    fotoDpiAdelanteUrl: { type: String, required: true },
    fotoDpiAtrasUrl: { type: String, required: true },
    fotoRostroUrl: { type: String, required: true },
    
    ingresosMensuales: { type: Number, default: 0 },
    passwordHash: { type: String, select: false },
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