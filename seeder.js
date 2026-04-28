import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/modules/users/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('🔌 Conectado a MongoDB para el sembrado de datos...');

        // Limpiar datos previos
        await User.deleteMany({});

        const passwordHash = await bcrypt.hash('Password123!', 10);

        const users = [
            // 1 Administrador
            {
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
            }
        ];

        // 10 Usuarios Clientes
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

        await User.insertMany(users);
        console.log('✅ DataSeeder completado: 1 Administrador y 10 Usuarios creados.');
        console.log('🔑 Contraseña universal: Password123!');
        
        process.exit();
    } catch (error) {
        console.error('❌ Error en el DataSeeder:', error);
        process.exit(1);
    }
};

seedData();