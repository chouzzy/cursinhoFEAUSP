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
exports.ListStudentsUseCase = void 0;
const ListStudentsCheck_1 = require("./ListStudentsCheck");
//////
class ListStudentsUseCase {
    constructor(studentsRepository) {
        this.studentsRepository = studentsRepository;
    }
    execute(studentsRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const bodyValidation = yield (0, ListStudentsCheck_1.checkQuery)(studentsRequest);
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            let { page, pageRange, initDate, endDate } = studentsRequest;
            if (initDate === undefined) {
                studentsRequest.initDate = '1979-01-01';
            }
            if (endDate === undefined) {
                studentsRequest.endDate = '2999-01-01';
            }
            const pageAsNumber = parseInt((page === null || page === void 0 ? void 0 : page.toString()) || "0", 10);
            const pageRangeAsNumber = parseInt((pageRange === null || pageRange === void 0 ? void 0 : pageRange.toString()) || "10", 10);
            if (isNaN(pageAsNumber) || isNaN(pageRangeAsNumber)) {
                return {
                    isValid: false,
                    statusCode: 400,
                    errorMessage: "page and pageRange must be numbers",
                };
            }
            const students = yield this.studentsRepository.filterStudent(studentsRequest, pageAsNumber, pageRangeAsNumber);
            return students;
        });
    }
}
exports.ListStudentsUseCase = ListStudentsUseCase;
