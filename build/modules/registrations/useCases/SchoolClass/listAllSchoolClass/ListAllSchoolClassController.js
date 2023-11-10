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
exports.ListAllSchoolClassController = void 0;
const SchoolClassRepository_1 = require("../../../repositories/implementations/SchoolClassRepository");
const ListAllSchoolClassUseCase_1 = require("./ListAllSchoolClassUseCase");
class ListAllSchoolClassController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Instanciando o useCase no repositório com as funções
            const { title } = req.query;
            // const { id } = req.params
            const schoolClassRepository = new SchoolClassRepository_1.SchoolClassRepository();
            const listSchoolClassUseCase = new ListAllSchoolClassUseCase_1.ListAllSchoolClassUseCase(schoolClassRepository);
            const schoolClassResponse = yield listSchoolClassUseCase.execute(title);
            return res.status(schoolClassResponse.statusCode).json({ schoolClassResponse });
        });
    }
}
exports.ListAllSchoolClassController = ListAllSchoolClassController;
