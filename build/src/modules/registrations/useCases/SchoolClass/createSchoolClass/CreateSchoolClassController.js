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
exports.CreateSchoolClassController = void 0;
const CreateSchoolClassUseCase_1 = require("./CreateSchoolClassUseCase");
const SchoolClassRepository_1 = require("../../../repositories/implementations/SchoolClassRepository");
class CreateSchoolClassController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const schoolClassData = req.body;
            /// instanciação da classe do caso de uso
            const schoolClassRepository = new SchoolClassRepository_1.SchoolClassRepository();
            const createSchoolClassUseCase = new CreateSchoolClassUseCase_1.CreateSchoolClassUseCase(schoolClassRepository);
            const createdSchoolClassResponse = yield createSchoolClassUseCase.execute(schoolClassData);
            return res.status(createdSchoolClassResponse.statusCode)
                .json({ createdSchoolClassResponse });
        });
    }
}
exports.CreateSchoolClassController = CreateSchoolClassController;
