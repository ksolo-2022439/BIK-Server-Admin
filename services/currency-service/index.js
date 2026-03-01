const express = require('express');
const mongoose = require('mongoose');
const initCurrencyCron = require('./Cron/currency.cron.js');
const { convert } = require('./Controllers/currency.controller.js');
const { refreshExchangeRates } = require('./Services/currency.service.js');

const app = express();
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/bik_currencies')
    .then(() => console.log("Conectado a MongoDB"))
    .catch(err => console.error("Error de conexión a MongoDB:", err));

initCurrencyCron();

app.post('/BIK/v1/currencies/convert', convert);

app.listen(3001, () => {
    console.log("Currency Service ejecutándose en puerto 3001");
    refreshExchangeRates();
});