import mongoose from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';

// Import all models
import User from './src/modules/users/user.model.js';
import Account from './src/modules/accounts/account.model.js';
import RequestModel from './src/modules/requests/request.model.js';
import Card from './src/modules/cards/card.model.js';
import Transaction from './src/modules/transactions/transaction.model.js';

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bik_db');
    console.log('Connected to MongoDB');

    const models = [User, Account, RequestModel, Card, Transaction];
    let totalUpdated = 0;

    for (const Model of models) {
      const docs = await Model.find({ publicId: { $exists: false } });
      console.log(`Found ${docs.length} documents in ${Model.modelName} needing publicId`);
      
      for (const doc of docs) {
        doc.publicId = crypto.randomUUID();
        await doc.save();
        totalUpdated++;
      }
    }

    console.log(`Migration complete. Updated ${totalUpdated} documents.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
