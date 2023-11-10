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
exports.CreateSchoolClassStagesUseCase = void 0;
const CreateSchoolClassStagesCheck_1 = require("./CreateSchoolClassStagesCheck");
class CreateSchoolClassStagesUseCase {
    constructor(schoolClassRepository) {
        this.schoolClassRepository = schoolClassRepository;
    }
    execute(schoolClassStagesData, schoolClassID) {
        return __awaiter(this, void 0, void 0, function* () {
            /// é responsabilidade do controller validar os dados recebidos na requisição
            const bodyValidation = yield (0, CreateSchoolClassStagesCheck_1.checkBody)(schoolClassStagesData);
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            schoolClassStagesData.map(stage => {
                if (!stage.resultsDate) {
                    stage.resultsDate = null;
                }
            });
            const createSchoolClassResponse = yield this.schoolClassRepository.createStages(schoolClassStagesData, schoolClassID);
            return createSchoolClassResponse;
        });
    }
}
exports.CreateSchoolClassStagesUseCase = CreateSchoolClassStagesUseCase;
