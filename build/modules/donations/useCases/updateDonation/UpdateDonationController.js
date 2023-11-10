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
exports.UpdateDonationController = void 0;
const DonationsRepository_1 = require("../../repositories/implementations/DonationsRepository");
const UpdateDonationCheck_1 = require("./UpdateDonationCheck");
const UpdateDonationUseCase_1 = require("./UpdateDonationUseCase");
class UpdateDonationController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const donationData = req.body;
            //é responsabilidade do controller validar os dados recebidos na requisição
            if (!donationData.cpf && donationData.cnpj) {
                donationData.cpf = "Não informado";
            }
            const bodyValidation = yield (0, UpdateDonationCheck_1.checkBody)(donationData);
            if (bodyValidation.isValid === false) {
                return res.status(bodyValidation.statusCode).json({
                    errorMessage: bodyValidation.errorMessage
                });
            }
            const donationsRepository = new DonationsRepository_1.DonationsRepository();
            const updateDonationUseCase = new UpdateDonationUseCase_1.UpdateDonationUseCase(donationsRepository);
            const updatedDonation = yield updateDonationUseCase.execute(donationData);
            const updatedDonationIsValid = yield (0, UpdateDonationCheck_1.ErrorValidation)(updatedDonation);
            if (updatedDonationIsValid.isValid === false) {
                return res.status(updatedDonationIsValid.statusCode).json({
                    errorMessage: updatedDonationIsValid.errorMessage
                });
            }
            return res.status(202).json({
                updatedDonation
            });
        });
    }
}
exports.UpdateDonationController = UpdateDonationController;
