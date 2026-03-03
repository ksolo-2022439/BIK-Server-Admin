import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    username: {
        type: String,
        required: [true, 'El nombre de usuario es obligatorio'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria']
    },
    role: {
        type: String,
        enum: ['ADMIN_ROLE', 'USER_ROLE'],
        default: 'USER_ROLE'
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    versionKey: false,
    timestamps: true
});

// Con este metodo, se ocultara la contraseña en las respuestas json
userSchema.methods.toJSON = function () {
    const { password, ...user } = this.toObject();
    return user;
};

export default model('User', userSchema);