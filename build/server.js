"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.stripe = void 0;
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const AppError_1 = require("./errors/AppError");
const routes_1 = require("./routes");
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
exports.stripe = stripe;
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
exports.io = io;
app.use((0, cors_1.default)({
    origin: "*",
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH'],
}));
app.use(express_1.default.json());
app.use(body_parser_1.default.json({ type: 'application/json' }));
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
io.on('connection', (socket) => {
    console.log('Um usuário se conectou');
    // ... (implementar lógica para lidar com eventos e enviar mensagens)
    socket.on('disconnect', () => {
        console.log('Um usuário desconectou');
    });
});
server.listen(3000, () => console.log('Sir, we are back online! 🦥'));
