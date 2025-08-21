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
exports.UpdateSchoolClassUseCase = void 0;
const UpdateSchoolClassCheck_1 = require("./UpdateSchoolClassCheck");
class UpdateSchoolClassUseCase {
    constructor(schoolClassRepository) {
        this.schoolClassRepository = schoolClassRepository;
    }
    execute(schoolClassData, schoolClassID) {
        return __awaiter(this, void 0, void 0, function* () {
            const bodyValidation = yield (0, UpdateSchoolClassCheck_1.checkBody)(schoolClassData);
            if (schoolClassData.subscriptions.price) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "O Stripe não aceita atualizações de preços.",
                });
            }
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            const upatedSchoolClassResponse = yield this.schoolClassRepository.updateSchoolClass(schoolClassData, schoolClassID);
            return upatedSchoolClassResponse;
        });
    }
}
exports.UpdateSchoolClassUseCase = UpdateSchoolClassUseCase;
