"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agent = exports.cert = exports.stripe = void 0;
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const AppError_1 = require("./errors/AppError");
const routes_1 = require("./routes");
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const https_1 = __importDefault(require("https"));
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
exports.stripe = stripe;
const cert = fs_1.default.readFileSync(path_1.default.resolve(__dirname, `../certs/${process.env.EFI_CERT}`));
exports.cert = cert;
const agent = new https_1.default.Agent({
    pfx: cert,
    passphrase: ''
});
exports.agent = agent;
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "*",
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'],
}));
// app.use(bodyParser.json({ type: 'application/json' }))
// app.use('/webhooks', express.raw({ type: "*/*" }));
// app.use(express.json({type:"application/json"}))
app.use(routes_1.router);
// Tratamento de erro
app.use((err, req, res, next) => {
    // Erros instanciados na classe AppError, ex throw new AppError(lalala)
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({
            message: err.message
        });
    }
    // Erro sem instanciar na classe App Error ex Throw new Error(lalala)
    return res.status(500).json({
        status: 'error',
        message: `⛔ Internal Server Error: ${err.message}⛔`
    });
});
app.listen(3001, () => console.log('Sir, we are back online! 🦥'));
