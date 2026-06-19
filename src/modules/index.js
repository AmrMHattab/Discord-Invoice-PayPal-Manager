const { PayPalService } = require('./payment_api');
const { CanvasService } = require('./image_renderer');
const { DatabaseService } = require('./storage');

const paymentApi = new PayPalService();
const imageRenderer = new CanvasService();
const storage = new DatabaseService();

module.exports = {
    paymentApi,
    imageRenderer,
    storage
};
