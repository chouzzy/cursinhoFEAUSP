"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookEfiRoutes = void 0;
const express_1 = require("express");
const webhookEfiRoutes = (0, express_1.Router)();
exports.webhookEfiRoutes = webhookEfiRoutes;
webhookEfiRoutes.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('rota webhook acionada');
    // Aqui voc� pode acessar os dados da requisi��o
    console.log(req.body);
    // Responda ao webhook (opcional)
    res.sendStatus(200);
}));
