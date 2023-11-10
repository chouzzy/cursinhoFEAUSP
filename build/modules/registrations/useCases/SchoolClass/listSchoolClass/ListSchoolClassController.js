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
exports.ListSchoolClassController = void 0;
const SchoolClassRepository_1 = require("../../../repositories/implementations/SchoolClassRepository");
const ListSchoolClassUseCase_1 = require("./ListSchoolClassUseCase");
class ListSchoolClassController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Instanciando o useCase no repositório com as funções
            const { page, pageRange, status } = req.query;
            const schoolClassRepository = new SchoolClassRepository_1.SchoolClassRepository();
            const listSchoolClassUseCase = new ListSchoolClassUseCase_1.ListSchoolClassUseCase(schoolClassRepository);
            const schoolClassResponse = yield listSchoolClassUseCase.execute({ page, pageRange, status });
            return res.status(schoolClassResponse.statusCode).json({ schoolClassResponse });
        });
    }
}
exports.ListSchoolClassController = ListSchoolClassController;
