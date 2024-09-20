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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEfíAccessToken = exports.criarCobrancaPix = void 0;
const axios_1 = __importDefault(require("axios"));
function getEfíAccessToken(agent, credentials) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield (0, axios_1.default)({
                method: 'POST',
                url: `${process.env.EFI_ENDPOINT}/oauth/token`,
                headers: {
                    Authorization: `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                },
                httpsAgent: agent,
                data: {
                    grant_type: 'client_credentials'
                }
            });
            return response.data.access_token;
        }
        catch (error) {
            console.error('Error obtaining Efí access token:', error);
            throw error; // Re-throw the error for further handling
        }
    });
}
exports.getEfíAccessToken = getEfíAccessToken;
function criarCobrancaPix(agent, token, dadosCobranca) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield (0, axios_1.default)({
                method: 'POST',
                url: `${process.env.EFI_ENDPOINT}/v2/cob`,
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                httpsAgent: agent,
                data: dadosCobranca
            });
            console.log('Cobrança criada com sucesso:', response.data);
            return response.data; // Retorna os dados da cobrança criada
        }
        catch (error) {
            console.error('Erro ao criar cobrança:', error);
            throw error; // Lança o erro para ser tratado em outro ponto da aplicação
        }
    });
}
exports.criarCobrancaPix = criarCobrancaPix;
