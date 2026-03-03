import User from '../src/users/user.model.js';
import { encrypt } from '../src/utils/encrypt.js';

export const createAdminSeed = async () => {
    try {
        const adminExists = await User.findOne({ role: 'ADMIN_ROLE' });
        
        if (adminExists) {
            console.log('El administrador base ya existe en la base de datos.');
            return;
        }

        // si no existiera, lo crea
        const hashedPassword = await encrypt('ADMINB');
        
        const adminUser = new User({
            username: 'ADMINB',
            password: hashedPassword,
            role: 'ADMIN_ROLE'
        });

        await adminUser.save();
        console.log('Administrador base (ADMINB) creado exitosamente.');
    } catch (error) {
        console.error('Error al crear el administrador base (Seeding):', error);
    }
};