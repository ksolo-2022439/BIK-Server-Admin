import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/modules/users/user.model.js';
import Account from './src/modules/accounts/account.model.js';
import Card from './src/modules/cards/card.model.js';
import Currency from './src/modules/currency/currency.model.js';
import dotenv from 'dotenv';

dotenv.config();

export const seedData = async () => {
    try {
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('🔌 Conectado a MongoDB para el sembrado de datos...');
        } else {
            console.log('🔌 Ya conectado a MongoDB, procediendo con el sembrado...');
        }

        // Verificar si ya existen datos para no destruir información real
        const existingUsers = await User.countDocuments();
        if (existingUsers > 0) {
            console.log(`⏩ DataSeeder omitido: Ya existen ${existingUsers} usuarios en la base de datos.`);
            return;
        }

        console.log('📦 Base de datos vacía detectada. Ejecutando DataSeeder...');

        const passwordHash = await bcrypt.hash('Password123!', 10);

        const users = [
            {
                publicId: "00000000-0000-0000-0000-000000000001",
                nombres: "Admin",
                apellidos: "Sistema",
                dpi: "1111222233334",
                fechaNacimiento: new Date("1990-01-01"),
                direccion: { departamento: "Guatemala", municipio: "Guatemala", zona: "1", detalle: "Sede Central" },
                telefono: "22334455",
                email: "admin@bik.com",
                passwordHash, // C# leerá este campo para el login
                fotoDpiAdelanteUrl: "https://bik.com/uploads/admin_front.png",
                fotoDpiAtrasUrl: "https://bik.com/uploads/admin_back.png",
                fotoRostroUrl: "https://bik.com/uploads/admin_face.png",
                ingresosMensuales: 15000,
                estado: "Activo",
                rol: "Administrador"
            },
            {
                publicId: "6a0503d7-35a6-d63c-7a4d-486400000000",
                nombres: "Juan",
                apellidos: "Pruebas",
                dpi: "3333444455556",
                fechaNacimiento: new Date("1992-05-15"),
                direccion: { departamento: "Guatemala", municipio: "Guatemala", zona: "10", detalle: "Edificio X" },
                telefono: "55554444",
                email: "cliente@bik.com",
                passwordHash,
                fotoDpiAdelanteUrl: "https://bik.com/uploads/cliente_front.png",
                fotoDpiAtrasUrl: "https://bik.com/uploads/cliente_back.png",
                fotoRostroUrl: "https://bik.com/uploads/cliente_face.png",
                ingresosMensuales: 8000,
                estado: "Activo",
                rol: "Cliente"
            },
            {
                nombres: "María",
                apellidos: "González",
                dpi: "4444555566667",
                fechaNacimiento: new Date("1988-03-20"),
                direccion: { departamento: "Guatemala", municipio: "Guatemala", zona: "4", detalle: "Oficina Central" },
                telefono: "33445566",
                email: "gestiones@bik.com",
                passwordHash,
                fotoDpiAdelanteUrl: "https://bik.com/uploads/gestiones_front.png",
                fotoDpiAtrasUrl: "https://bik.com/uploads/gestiones_back.png",
                fotoRostroUrl: "https://bik.com/uploads/gestiones_face.png",
                ingresosMensuales: 12000,
                estado: "Activo",
                rol: "Admin_Gestiones"
            },
            {
                nombres: "Carlos",
                apellidos: "Ramírez",
                dpi: "5555666677778",
                fechaNacimiento: new Date("1995-07-10"),
                direccion: { departamento: "Guatemala", municipio: "Guatemala", zona: "7", detalle: "Call Center" },
                telefono: "44556677",
                email: "soporte@bik.com",
                passwordHash,
                fotoDpiAdelanteUrl: "https://bik.com/uploads/soporte_front.png",
                fotoDpiAtrasUrl: "https://bik.com/uploads/soporte_back.png",
                fotoRostroUrl: "https://bik.com/uploads/soporte_face.png",
                ingresosMensuales: 8500,
                estado: "Activo",
                rol: "Soporte_Remoto"
            },
            {
                nombres: "Ana",
                apellidos: "López",
                dpi: "6666777788889",
                fechaNacimiento: new Date("1991-11-25"),
                direccion: { departamento: "Guatemala", municipio: "Guatemala", zona: "1", detalle: "Agencia Central" },
                telefono: "55667788",
                email: "presencial@bik.com",
                passwordHash,
                fotoDpiAdelanteUrl: "https://bik.com/uploads/presencial_front.png",
                fotoDpiAtrasUrl: "https://bik.com/uploads/presencial_back.png",
                fotoRostroUrl: "https://bik.com/uploads/presencial_face.png",
                ingresosMensuales: 9000,
                estado: "Activo",
                rol: "Soporte_Presencial"
            },
            {
                nombres: "Pedro",
                apellidos: "Martínez",
                dpi: "7777888899990",
                fechaNacimiento: new Date("1993-09-05"),
                direccion: { departamento: "Guatemala", municipio: "Guatemala", zona: "1", detalle: "Agencia Central Ventanilla 1" },
                telefono: "66778899",
                email: "cajero@bik.com",
                passwordHash,
                fotoDpiAdelanteUrl: "https://bik.com/uploads/cajero_front.png",
                fotoDpiAtrasUrl: "https://bik.com/uploads/cajero_back.png",
                fotoRostroUrl: "https://bik.com/uploads/cajero_face.png",
                ingresosMensuales: 7500,
                estado: "Activo",
                rol: "Cajero"
            }
        ];

        // 10 Usuarios Clientes aleatorios
        for (let i = 1; i <= 10; i++) {
            users.push({
                nombres: `Usuario${i}`,
                apellidos: `Apellido${i}`,
                dpi: `200000000000${i}`.slice(-13),
                fechaNacimiento: new Date("1995-05-15"),
                direccion: { departamento: "Guatemala", municipio: "Mixco", zona: "10", detalle: `Calle ${i} Casa ${i}` },
                telefono: `5500000${i}`,
                email: `user${i}@mail.com`,
                passwordHash,
                fotoDpiAdelanteUrl: `https://bik.com/uploads/u${i}_front.png`,
                fotoDpiAtrasUrl: `https://bik.com/uploads/u${i}_back.png`,
                fotoRostroUrl: `https://bik.com/uploads/u${i}_face.png`,
                ingresosMensuales: 5000 + (i * 100),
                estado: i % 2 === 0 ? "Activo" : "En Verificacion", // Mitad activos para pruebas
                rol: "Cliente"
            });
        }

        const createdUsers = await User.insertMany(users);
        console.log('✅ DataSeeder completado: Administrador, Cliente Pruebas y 10 Usuarios creados.');
        
        const clientePrueba = createdUsers.find(u => u.email === 'cliente@bik.com');
        if (clientePrueba) {
            const accAhorro = await Account.create({
                numeroCuenta: '4000000001',
                usuarioId: clientePrueba._id,
                tipo: 'Ahorro',
                moneda: 'GTQ',
                saldo: 15450.75,
                limiteTransferenciaDiario: 2000,
                isFavorite: true,
                estado: 'Activa'
            });

            const accMonetaria = await Account.create({
                numeroCuenta: '3000000001',
                usuarioId: clientePrueba._id,
                tipo: 'Monetaria',
                moneda: 'USD',
                saldo: 4200.50,
                limiteTransferenciaDiario: 5000,
                isFavorite: false,
                estado: 'Activa'
            });

            await Card.create({
                numeroTarjeta: '4111111111111111',
                usuarioId: clientePrueba._id,
                cuentaVinculadaId: accMonetaria._id,
                tipo: 'Debito Fisica',
                cvv: '123',
                fechaExpiracion: '12/28',
                configuraciones: {
                    bloqueada: false,
                    comprasInternacionales: true
                }
            });

            await Card.create({
                numeroTarjeta: '5111111111111111',
                usuarioId: clientePrueba._id,
                tipo: 'Credito',
                limiteCredito: 10000,
                saldoUtilizado: 2350.25,
                fechaCorte: 15,
                fechaPago: 5,
                cvv: '456',
                fechaExpiracion: '10/27',
                configuraciones: {
                    bloqueada: false,
                    comprasInternacionales: true
                }
            });
            console.log('✅ Cuentas y tarjetas creadas de prueba para cliente@bik.com.');
        }

        // Sembrar tasas de cambio si no existen
        const existingRates = await Currency.countDocuments();
        if (existingRates === 0) {
            await Currency.create({
                monedaBase: 'USD',
                monedaDestino: 'GTQ',
                tasaCompra: 7.75,
                tasaVenta: 7.95,
                fechaActualizacion: new Date()
            });
            console.log('✅ Tasas de cambio USD/GTQ creadas (Compra: 7.75, Venta: 7.95).');
        }

        console.log('🔑 Contraseña universal: Password123!');
        
        if (process.argv[1] && process.argv[1].endsWith('seeder.js')) {
            process.exit(0);
        }
    } catch (error) {
        console.error('❌ Error en el DataSeeder:', error);
        if (process.argv[1] && process.argv[1].endsWith('seeder.js')) {
            process.exit(1);
        } else {
            throw error;
        }
    }
};

// Only run automatically if executed directly
if (process.argv[1] && process.argv[1].endsWith('seeder.js')) {
    seedData();
}