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
exports.CreatePixDonationController = void 0;
const DonationsRepository_1 = require("../../repositories/implementations/DonationsRepository");
const CreatePixDonationUseCase_1 = require("./CreatePixDonationUseCase");
class CreatePixDonationController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pixDonationData = req.body;
                const donationsRepository = new DonationsRepository_1.DonationsRepository();
                const createPixDonationUseCase = new CreatePixDonationUseCase_1.CreatePixDonationUseCase(donationsRepository);
                const response = yield createPixDonationUseCase.execute(pixDonationData);
                return res.status(202).json({ response });
            }
            catch (error) {
                return res.status(403).send({ message: String(error) });
            }
        });
    }
}
exports.CreatePixDonationController = CreatePixDonationController;
