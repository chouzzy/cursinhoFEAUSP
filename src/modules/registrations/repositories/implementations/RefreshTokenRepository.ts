import { Prisma } from "@prisma/client";
import dayjs from "dayjs";
import { prisma } from "../../../../prisma";
import { validationResponse } from "../../../../types";
import { RefreshToken } from "../../entities/RefreshToken";
import { GenerateRefreshToken } from "../../provider/GenerateRefreshToken";
import { GenerateTokenProvider } from "../../provider/GenerateTokenProvider";
import { IRefreshTokenRepository } from "../IRefreshTokenRepository";
import { RefreshTokenRequestProps } from "../../useCases/refreshToken/RefreshTokenController";


class RefreshTokenRepository implements IRefreshTokenRepository {

    private refreshToken: RefreshToken[]

    constructor() {
        this.refreshToken = []
    }

    async refreshTokenValidation(refreshToken: RefreshTokenRequestProps): Promise<validationResponse> {

        try {

            const adminRefreshToken = await prisma.refreshToken.findFirst({
                where: {
                    id: refreshToken.id
                }
            })

            if (!adminRefreshToken) {
                return { isValid: false, errorMessage: "Refresh Token inválido", statusCode: 401 }
            }


            // const adminFound = await prisma.admins.findFirst({
            //     where: {
            //         id: adminRefreshToken.adminID
            //     }
            // })

            // if (!adminFound) {
            //     return { isValid: false, errorMessage: "Refresh Token inválido", statusCode: 401 }
            // }


            const refreshTokenExpired = dayjs().isAfter(dayjs.unix(adminRefreshToken.expires_at))

            if (refreshTokenExpired) {

                await prisma.refreshToken.deleteMany({
                    where: {
                        adminID: adminRefreshToken.adminID
                    }
                })
                return { isValid: false, errorMessage: "Refresh Token inválido", statusCode: 401 }
            }

            await prisma.refreshToken.deleteMany({
                where: {
                    adminID: adminRefreshToken.adminID
                }
            })

            //gera novo access token
            const generateTokenProvider = new GenerateTokenProvider()
            const token = await generateTokenProvider.execute(adminRefreshToken.adminID)

            //apagar o refresh token e enviar um 401 refresh token expired
            const generateRefreshToken = new GenerateRefreshToken()
            const newRefreshToken = await generateRefreshToken.execute(adminRefreshToken.adminID)

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
            }



        } catch (error) {
            if (error instanceof Prisma.PrismaClientValidationError) {

                const argumentPosition = error.message.search('Argument')
                const mongoDBError = error.message.slice(argumentPosition)
                return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }

            } else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }
}

export { RefreshTokenRepository }