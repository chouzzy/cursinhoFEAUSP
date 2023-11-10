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
exports.CreateDonationUseCase = void 0;
const CreateDonationCheck_1 = require("./CreateDonationCheck");
class CreateDonationUseCase {
    constructor(donationsRepository) {
        this.donationsRepository = donationsRepository;
    }
    execute(donationData) {
        return __awaiter(this, void 0, void 0, function* () {
            //é responsabilidade do controller validar os dados recebidos na requisição
            if (!donationData.cpf && donationData.cnpj) {
                donationData.cpf = "Não informado";
            }
            if (donationData.rg === "Não informado") {
                donationData.ufrg = "Não informado";
            }
            if (!donationData.cpf && !donationData.cnpj) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: 'É necessário o envio de CNPJ ou de CPF.',
                });
            }
            const bodyValidation = yield (0, CreateDonationCheck_1.checkBody)(donationData);
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            const createdDonation = yield this.donationsRepository.createDonation(donationData);
            return createdDonation;
        });
    }
}
exports.CreateDonationUseCase = CreateDonationUseCase;
