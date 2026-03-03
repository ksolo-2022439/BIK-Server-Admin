import argon2 from 'argon2';

export const encrypt = async (password) => {
    try {
        return await argon2.hash(password);
    } catch (err) {
        console.error("Error al encriptar la contraseña:", err);
        throw new Error("Error encrypting password");
    }
}

export const verifyPassword = async (hash, password) => {
    try {
        return await argon2.verify(hash, password);
    } catch (err) {
        console.error("Error al verificar la contraseña:", err);
        throw new Error("Error verifying password");
    }
}