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
exports.UpdateSchoolClassController = void 0;
const SchoolClassRepository_1 = require("../../../repositories/implementations/SchoolClassRepository");
const UpdateSchoolClassUseCase_1 = require("./UpdateSchoolClassUseCase");
class UpdateSchoolClassController {
    handle(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const schoolClassData = req.body;
            const { schoolClassID } = req.params;
            /// instanciação da classe do caso de uso
            const schoolClasssRepository = new SchoolClassRepository_1.SchoolClassRepository();
            const updateSchoolClassUseCase = new UpdateSchoolClassUseCase_1.UpdateSchoolClassUseCase(schoolClasssRepository);
            const updatedSchoolClassResponse = yield updateSchoolClassUseCase.execute(schoolClassData, schoolClassID);
            ///
            return res.status(updatedSchoolClassResponse.statusCode)
                .json({ updatedSchoolClassResponse });
        });
    }
}
exports.UpdateSchoolClassController = UpdateSchoolClassController;
