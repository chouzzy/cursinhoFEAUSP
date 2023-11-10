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
exports.UpdateAdminsUseCase = void 0;
const UpdateAdminsCheck_1 = require("./UpdateAdminsCheck");
class UpdateAdminsUseCase {
    constructor(adminsRepository) {
        this.adminsRepository = adminsRepository;
    }
    execute(adminData, adminID) {
        return __awaiter(this, void 0, void 0, function* () {
            const bodyValidation = yield (0, UpdateAdminsCheck_1.checkBody)(adminData);
            if (bodyValidation.isValid === false) {
                return ({
                    isValid: false,
                    statusCode: 403,
                    errorMessage: bodyValidation.errorMessage,
                });
            }
            const upatedAdmin = yield this.adminsRepository.updateAdmin(adminData, adminID);
            return upatedAdmin;
        });
    }
}
exports.UpdateAdminsUseCase = UpdateAdminsUseCase;
