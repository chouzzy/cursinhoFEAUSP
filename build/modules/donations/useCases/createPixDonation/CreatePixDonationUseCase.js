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
exports.CreatePixDonationUseCase = void 0;
const CreatePixDonationCheck_1 = require("./CreatePixDonationCheck");
class CreatePixDonationUseCase {
    constructor(donationsRepository) {
        this.donationsRepository = donationsRepository;
    }
    execute(pixDonationData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!pixDonationData.cpf && pixDonationData.cnpj) {
                pixDonationData.cpf = "Não informado";
            }
            if (pixDonationData.rg === "Não informado") {
                pixDonationData.ufrg = "Não informado";
            }
            if (!pixDonationData.cpf && !pixDonationData.cnpj) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: 'É necessário o envio de CNPJ ou de CPF.',
                });
            }
            const bodyValidation = yield (0, CreatePixDonationCheck_1.checkBody)(pixDonationData);
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            const createdDonation = yield this.donationsRepository.createPixDonation(pixDonationData);
            return createdDonation;
        });
    }
}
exports.CreatePixDonationUseCase = CreatePixDonationUseCase;
