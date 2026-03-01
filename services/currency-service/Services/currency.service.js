const axios = require('axios');
const Currency = require('../Models/currency.model.js');

const refreshExchangeRates = async () => {
    try {
        console.log("Obteniendo tasas desde API externa...");
        const response = await axios.get('https://open.er-api.com/v6/latest/USD');
        const { rates } = response.data;

        const updatedRates = {
            rates: {
                GTQ: rates.GTQ,
                USD: rates.USD,
                EUR: rates.EUR
            },
            updatedAt: new Date()
        };

        await Currency.findOneAndUpdate({ base: 'USD' }, updatedRates, { upsert: true });
        console.log("Base de datos local actualizada.");
    } catch (error) {
        console.error("Error actualizando divisas:", error.message);
    }
};

module.exports = { refreshExchangeRates };