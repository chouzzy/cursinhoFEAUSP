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
exports.CreateSchoolClassDocsController = void 0;
const CreateSchoolClassDocsUseCase_1 = require("./CreateSchoolClassDocsUseCase");
const SchoolClassRepository_1 = require("../../../repositories/implementations/SchoolClassRepository");
class CreateSchoolClassDocsController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const schoolClassDocsData = req.body;
            const { schoolClassID } = req.params;
            /// instanciação da classe do caso de uso
            const schoolClassRepository = new SchoolClassRepository_1.SchoolClassRepository();
            const createSchoolClassDocsUseCase = new CreateSchoolClassDocsUseCase_1.CreateSchoolClassDocsUseCase(schoolClassRepository);
            const response = yield createSchoolClassDocsUseCase.execute(schoolClassDocsData, schoolClassID);
            return res.status(response.statusCode).json(response);
        });
    }
}
exports.CreateSchoolClassDocsController = CreateSchoolClassDocsController;
