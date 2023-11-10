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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenRepository = void 0;
const client_1 = require("@prisma/client");
const dayjs_1 = __importDefault(require("dayjs"));
const prisma_1 = require("../../../../prisma");
const GenerateRefreshToken_1 = require("../../provider/GenerateRefreshToken");
const GenerateTokenProvider_1 = require("../../provider/GenerateTokenProvider");
class RefreshTokenRepository {
    constructor() {
        this.refreshToken = [];
    }
    refreshTokenValidation(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const adminRefreshToken = yield prisma_1.prisma.refreshToken.findFirst({
                    where: {
                        id: refreshToken.id
                    }
                });
                if (!adminRefreshToken) {
                    return { isValid: false, errorMessage: "Refresh Token inválido", statusCode: 401 };
                }
                // const adminFound = await prisma.admins.findFirst({
                //     where: {
                //         id: adminRefreshToken.adminID
                //     }
                // })
                // if (!adminFound) {
                //     return { isValid: false, errorMessage: "Refresh Token inválido", statusCode: 401 }
                // }
                const refreshTokenExpired = (0, dayjs_1.default)().isAfter(dayjs_1.default.unix(adminRefreshToken.expires_at));
                if (refreshTokenExpired) {
                    yield prisma_1.prisma.refreshToken.deleteMany({
                        where: {
                            adminID: adminRefreshToken.adminID
                        }
                    });
                    return { isValid: false, errorMessage: "Refresh Token inválido", statusCode: 401 };
                }
                yield prisma_1.prisma.refreshToken.deleteMany({
                    where: {
                        adminID: adminRefreshToken.adminID
                    }
                });
                //gera novo access token
                const generateTokenProvider = new GenerateTokenProvider_1.GenerateTokenProvider();
                const token = yield generateTokenProvider.execute(adminRefreshToken.adminID);
                //apagar o refresh token e enviar um 401 refresh token expired
                const generateRefreshToken = new GenerateRefreshToken_1.GenerateRefreshToken();
                const newRefreshToken = yield generateRefreshToken.execute(adminRefreshToken.adminID);
                return {
                    isValid: true,
                    token: token,
                    refreshToken: newRefreshToken.id,
                    // admins: {
                    //     id: adminFound.id,
                    //     name: adminFound.name,
                    //     username: adminFound.username,
                    //     email: adminFound.email,
                    // },
                    statusCode: 202
                };
            }
            catch (error) {
                if (error instanceof client_1.Prisma.PrismaClientValidationError) {
                    const argumentPosition = error.message.search('Argument');
                    const mongoDBError = error.message.slice(argumentPosition);
                    return { isValid: false, errorMessage: mongoDBError, statusCode: 403 };
                }
                else {
                    return { isValid: false, errorMessage: String(error), statusCode: 403 };
                }
            }
        });
    }
}
exports.RefreshTokenRepository = RefreshTokenRepository;
