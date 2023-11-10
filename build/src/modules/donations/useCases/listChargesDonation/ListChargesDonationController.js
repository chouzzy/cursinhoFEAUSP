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
exports.ListChargesDonationController = void 0;
const DonationsRepository_1 = require("../../repositories/implementations/DonationsRepository");
const ListChargesDonationUseCase_1 = require("./ListChargesDonationUseCase");
class ListChargesDonationController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { donationID } = req.params;
            const donationsRepository = new DonationsRepository_1.DonationsRepository();
            const listChargesDonationUseCase = new ListChargesDonationUseCase_1.ListChargesDonationsUseCase(donationsRepository);
            const response = yield listChargesDonationUseCase.execute(donationID);
            return res.status(response.statusCode).json({ response });
        });
    }
}
exports.ListChargesDonationController = ListChargesDonationController;
