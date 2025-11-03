import dayjs from "dayjs";
import { prisma } from "../../../prisma";
import { RefreshToken } from "../entities/RefreshToken";


class GenerateRefreshToken {

    async execute(adminID: RefreshToken["adminID"]): Promise<RefreshToken> {

        const expTimeNumber = Number(process.env.REFRESHTOKEN_EXPIRATION_TIME_NUMBER)
        // const expTimeUnit = process.env.REFRESHTOKEN_EXPIRATION_TIME_UNIT

        const expires_at = dayjs().add(expTimeNumber, 'days').unix();

        // **CORREÇÃO AQUI:** Trocamos 'create' por 'upsert'
        const newRefreshToken = await prisma.refreshToken.upsert({
            where: {
                adminID: adminID, // Onde procurar (o campo único)
            },
            update: {
                expires_at: expires_at, // O que fazer se ele já existir (só atualiza a data de expiração)
            },
            create: {
                adminID: adminID, // O que fazer se ele não existir
                expires_at: expires_at
            }
        })

        return newRefreshToken
    }
}

export { GenerateRefreshToken }
