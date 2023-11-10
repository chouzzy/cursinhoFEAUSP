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
exports.SyncDonationsController = void 0;
const DonationsRepository_1 = require("../../repositories/implementations/DonationsRepository");
const SyncDonationsUseCase_1 = require("./SyncDonationsUseCase");
class SyncDonationsController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Instanciando o useCase no repositório com as funções
            const donationsRepository = new DonationsRepository_1.DonationsRepository();
            const syncDonationsUseCase = new SyncDonationsUseCase_1.SyncDonationsUseCase(donationsRepository);
            const response = yield syncDonationsUseCase.execute();
            return res.status(response.statusCode).json(response);
        });
    }
}
exports.SyncDonationsController = SyncDonationsController;
