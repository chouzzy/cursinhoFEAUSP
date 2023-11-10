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
exports.ExcelListDonationsController = void 0;
const DonationsRepository_1 = require("../../repositories/implementations/DonationsRepository");
const ExcelListDonationsUseCase_1 = require("./ExcelListDonationsUseCase");
class ExcelListDonationsController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = req.query;
            // Instanciando o useCase no repositório com as funções
            const donationsRepository = new DonationsRepository_1.DonationsRepository();
            const excelListDonationsUseCase = new ExcelListDonationsUseCase_1.ExcelListDonationsUseCase(donationsRepository);
            const response = yield excelListDonationsUseCase.execute(query);
            if (response.statusCode != 202) {
                return res.status(response.statusCode).json(response);
            }
            // Set the response headers to indicate that we are sending an Excel file
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=donations.xlsx');
            // Send the file buffer as the response
            return res.status(response.statusCode).send(response.fileBuffer);
        });
    }
}
exports.ExcelListDonationsController = ExcelListDonationsController;
