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
exports.ListAdminsUseCase = void 0;
const ListAdminsCheck_1 = require("./ListAdminsCheck");
//////
class ListAdminsUseCase {
    constructor(adminsRepository) {
        this.adminsRepository = adminsRepository;
    }
    execute(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const queryValidation = yield (0, ListAdminsCheck_1.checkQuery)(query);
            if (queryValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: queryValidation.errorMessage,
                });
            }
            let { id, name, email, username, page = '0', pageRange = '10' } = query;
            const pageNumber = parseInt(page);
            const pageRangeNumber = parseInt(pageRange);
            if (isNaN(pageNumber)) {
                return {
                    isValid: false,
                    statusCode: 400,
                    errorMessage: 'page must be a number',
                };
            }
            if (isNaN(pageRangeNumber)) {
                return {
                    isValid: false,
                    statusCode: 400,
                    errorMessage: 'pageRange must be a number',
                };
            }
            const admins = yield this.adminsRepository.filterAdmins(id, name, email, username, pageNumber, pageRangeNumber);
            return admins;
        });
    }
}
exports.ListAdminsUseCase = ListAdminsUseCase;
