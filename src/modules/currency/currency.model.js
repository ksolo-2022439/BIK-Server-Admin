import mongoose from 'mongoose';

const currencySchema = new mongoose.Schema({
    monedaBase: { type: String, default: 'USD' },
    monedaDestino: { type: String, required: true }, // Ej. 'GTQ', 'EUR'
    tasaCompra: { type: Number, required: true },
    tasaVenta: { type: Number, required: true },
    fechaActualizacion: { type: Date, default: Date.now }
});

export default mongoose.model('Currency', currencySchema);