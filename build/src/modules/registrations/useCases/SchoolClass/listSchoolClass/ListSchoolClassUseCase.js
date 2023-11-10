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
exports.ListSchoolClassUseCase = void 0;
const ListSchoolClassCheck_1 = require("./ListSchoolClassCheck");
//////
class ListSchoolClassUseCase {
    constructor(schoolClassRepository) {
        this.schoolClassRepository = schoolClassRepository;
    }
    execute({ page, pageRange, status }) {
        return __awaiter(this, void 0, void 0, function* () {
            page = Number(page);
            pageRange = Number(pageRange);
            const bodyValidation = yield (0, ListSchoolClassCheck_1.checkBody)({ page, pageRange, status });
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            const response = yield this.schoolClassRepository.listSchoolClasses(page, pageRange, status);
            return response;
        });
    }
}
exports.ListSchoolClassUseCase = ListSchoolClassUseCase;