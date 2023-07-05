import { Prisma } from "@prisma/client";
import { compare, hash } from "bcryptjs";
import dayjs from "dayjs";
import { sign } from "jsonwebtoken";
import { prisma } from "../../../../prisma";
import { validationResponse } from "../../../../types";
import { Admins } from "../../entities/Admins";
import { GenerateRefreshToken } from "../../provider/GenerateRefreshToken";
import { GenerateTokenProvider } from "../../provider/GenerateTokenProvider";
import { AuthenticateAdminRequestProps } from "../../useCases/Admins/authenticateAdmin/AuthenticateAdminController";
import { CreateAdminRequestProps } from "../../useCases/Admins/createAdmins/CreateAdminController";
import { UpdateAdminRequestProps } from "../../useCases/Admins/updateAdmins/UpdateAdminsController";
import { UpdateAdminPasswordRequestProps } from "../../useCases/Admins/updateAdminsPassword/UpdateAdminsPasswordController";

import { IAdminsRepository } from "../IAdminsRepository";


class AdminsRepository implements IAdminsRepository {

    private admins: Admins[]
    constructor() {
        this.admins = [];
    }

    async filterAdmins(
        id: Admins["id"] | undefined,
        name: Admins["name"] | undefined,
        email: Admins["email"] | undefined,
        username: Admins["username"] | undefined,
        page: number,
        pageRange: number
        ):
        Promise<validationResponse> {

        // Função do prisma para buscar todos os admins
        try {

            if (page == 0) {
                page = 1
            }

            const admins = await prisma.admins.findMany({
                where: {
                    AND: [
                        { id: id },
                        { name: name },
                        { email: email },
                        { username: username },
                    ],
                },
                skip: (page -1) * pageRange,
                take: pageRange,
            })

            //Tentativa de redução de tempo na requisição //aumentou 100ms na requisição do banco
            const adminsSimplified = admins.map( (admin => {
                return {
                    id: admin.id,
                    name: admin.name,
                    username: admin.username,
                }
            }))


            return {
                isValid: true,
                statusCode: 202,
                adminsListSimplified: admins,
                totalDocuments: admins.length
            }
        } catch (error: unknown) {

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return { isValid: false, errorMessage: error, statusCode: 403 }

            } else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }

    async createAdmin(adminData: CreateAdminRequestProps): Promise<validationResponse> {

        try {

            //busca usuario no banco pra ve se existe
            const searchedAdmin = await prisma.admins.findMany({
                where: {
                    OR: [
                        { email: adminData.email },
                        { username: adminData.username },
                    ],
                },
            })

            //Checa se email e usuario ja existem
            if (searchedAdmin.length > 0) {

                if (searchedAdmin[0].email == adminData.email && searchedAdmin[0].username == adminData.username) {
                    return { isValid: false, errorMessage: `E-mail e nome de usuário já existem `, statusCode: 403 }
                }

                if (searchedAdmin[0].email == adminData.email) {
                    return { isValid: false, errorMessage: `🛑 E-mail já existente 🛑`, statusCode: 403 }
                }

                if (searchedAdmin[0].username == adminData.username) {
                    return { isValid: false, errorMessage: `🛑 Nome de usuário já existente 🛑`, statusCode: 403 }
                }


            }

            const passwordHash = await hash(adminData.password, 8)

            const createAdmin = await prisma.admins.create({
                data: {
                    name: adminData.name,
                    email: adminData.email,
                    username: adminData.username,
                    password: passwordHash,
                }
            })

            return {
                isValid: true,
                statusCode: 202,
                admins: {
                    id: createAdmin.id,
                    name: createAdmin.name,
                    email: createAdmin.email,
                    username: createAdmin.username
                },
                successMessage: 'Admnistrador criado com sucesso.'
            }


        } catch (error: unknown) {
            if (error instanceof Prisma.PrismaClientValidationError) {

                const argumentPosition = error.message.search('Argument')
                const mongoDBError = error.message.slice(argumentPosition)
                return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }

            } else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }

    async updateAdmin(adminData: UpdateAdminRequestProps, adminID: Admins["id"]): Promise<validationResponse> {

        try {
            const admin = await prisma.admins.findUnique({
                where: {
                    id: adminID
                }
            })

            if (admin == null) {
                return { isValid: false, errorMessage: '🛑 Admin not found 🛑', statusCode: 403 }
            }

            const updatedAdmin = await prisma.admins.update({
                where: {
                    id: adminID
                },
                data: {
                    name: adminData.name ?? admin.name,
                    email: adminData.email ?? admin.email,
                    username: adminData.username ?? admin.username,
                }
            })
            return {
                isValid: true,
                statusCode: 202,
                admins: updatedAdmin,
                successMessage: 'Administrador atualizado com sucesso.'
            }

        } catch (error: unknown) {

            if (error instanceof Prisma.PrismaClientValidationError) {
                const argumentPosition = error.message.search('Argument')
                const mongoDBError = error.message.slice(argumentPosition)
                return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return { isValid: false, errorMessage: error, statusCode: 403 }
            }

            else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }

    async updateAdminPassword(adminData: UpdateAdminPasswordRequestProps, adminID: string): Promise<validationResponse> {

        try {
            const admin = await prisma.admins.findUnique({
                where: {
                    id: adminID,
                },
            })

            if (admin == null) {
                return { isValid: false, errorMessage: 'Administrador não encontrado.', statusCode: 403 }
            }

            const passwordHash = await hash(adminData.password, 8)

            //Checando se o a nova senha é igual a antiga
            const passwordMatch = await compare(adminData.password, admin.password)
            if (passwordMatch) {
                
                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: 'A nova senha não pode ser igual a anterior.'
                }
            }

            const updatedAdmin = await prisma.admins.update({
                where: {
                    id: adminID
                },
                data: {
                    password: passwordHash,
                }
            })
            return {
                isValid: true,
                statusCode: 202,
                successMessage: 'Senha alterada com sucesso.'
            }

        } catch (error: unknown) {

            if (error instanceof Prisma.PrismaClientValidationError) {
                const argumentPosition = error.message.search('Argument')
                const mongoDBError = error.message.slice(argumentPosition)
                return { isValid: false, errorMessage: mongoDBError, statusCode: 403 }
            }

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return { isValid: false, errorMessage: error, statusCode: 403 }
            }

            else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }

    async deleteAdmin(adminID: string): Promise<validationResponse> {
        try {

            const admin = await prisma.admins.findUnique({
                where: {
                    id: adminID
                }
            })


            if (admin) {

                try {

                    await prisma.admins.delete({
                        where: {
                            id: adminID
                        }
                    })

                    return {
                        isValid: true,
                        statusCode: 202,
                        admins: admin
                    }

                } catch {

                    return {
                        isValid: false,
                        statusCode: 403,
                        errorMessage: "Ocorreu um erro ao tentar deletar o administrador"
                    }
                }

            }

            return {
                isValid: false,
                statusCode: 403,
                errorMessage: "Administrador não encontrado no banco de dados."
            }

        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return { isValid: false, errorMessage: error, statusCode: 403 }

            } else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }

    async authenticateAdmin({ username, password }: AuthenticateAdminRequestProps): Promise<validationResponse> {

        try {

            //Buscando o admin
            const adminFound = await prisma.admins.findFirst({
                where: {
                    username: username
                }
            })

            //Checando se o username está correto
            if (!adminFound) {
                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "Usuário ou senha incorretos."
                }
            }

            //Checando se o password está correto
            const passwordMatch = await compare(password, adminFound.password)
            if (!passwordMatch) {
                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "Usuário ou senha incorretos."
                }
            }


            // Gerando o Token
            const generateTokenProvider = new GenerateTokenProvider()
            const token = await generateTokenProvider.execute(adminFound.id)



            //Gerando refresh token
            const generateRefreshToken = new GenerateRefreshToken()
            const newRefreshToken = await generateRefreshToken.execute(adminFound.id)

            return {
                isValid: true,
                token: token,
                refreshToken: newRefreshToken.id,
                admins: {
                    id: adminFound.id,
                    name: adminFound.name,
                    username: adminFound.username,
                    email: adminFound.email
                }, statusCode: 202
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

export { AdminsRepository }
