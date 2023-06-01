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
        actualPage: number):
        Promise<validationResponse> {


        if (actualPage == 0) { actualPage = 1 }

        // Função do prisma para buscar todos os admins

        try {

            const admins = await prisma.admins.findMany({
                where: {
                    AND: [
                        { id: id },
                        { name: name },
                        { email: email },
                        { username: username },
                    ],
                },
            })

            if (admins.length == 0) {
                return {
                    isValid: false,
                    statusCode: 404,
                    errorMessage: '🔴 Admin not found 🔴'
                }
            }

            return {
                isValid: true,
                statusCode: 202,
                adminsList: admins
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
                    return { isValid: false, errorMessage: `🛑 E-mail and Username already exists 🛑`, statusCode: 403 }
                }

                if (searchedAdmin[0].email == adminData.email) {
                    return { isValid: false, errorMessage: `🛑 E-mail already exists 🛑`, statusCode: 403 }
                }

                if (searchedAdmin[0].username == adminData.username) {
                    return { isValid: false, errorMessage: `🛑 Username already exists 🛑`, statusCode: 403 }
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
                admins: createAdmin,
                successMessage: 'Admin successfully created'
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
                successMessage: 'Admin successfully updated'
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
                return { isValid: false, errorMessage: '🛑 Admin not found 🛑', statusCode: 403 }
            }

            const updatedAdmin = await prisma.admins.update({
                where: {
                    id: adminID
                },
                data: {
                    password: adminData.password ?? admin.password,
                }
            })
            return {
                isValid: true,
                statusCode: 202,
                successMessage: 'Password was successfully changed'
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
                        errorMessage: "⛔ An error occurred when trying to delete the admin from the database ⛔"
                    }
                }

            }

            return {
                isValid: false,
                statusCode: 403,
                errorMessage: "⛔ Admin not found in database ⛔"
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
                    errorMessage: "⛔ Username or password incorrect 1 ⛔"
                }
            }

            //Checando se o password está correto
            const passwordMatch = await compare(password, adminFound.password)
            if (!passwordMatch) {
                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "⛔ Username or password incorrect 2 ⛔"
                }
            }


            // Gerando o Token
            const generateTokenProvider = new GenerateTokenProvider()
            const token = await generateTokenProvider.execute(adminFound.id, adminFound.name, adminFound.email)




            //////// REFRESH TOKEN ////////

            //Buscando o RefreshToken do usuário logado
            const adminRefreshToken = await prisma.refreshToken.findFirst({
                where: {
                    adminID: adminFound.id
                }
            })

            //Checando se o RefreshToken do usuário logado existe
            if (!adminRefreshToken) {
                const generateRefreshToken = new GenerateRefreshToken()
                const refreshToken = await generateRefreshToken.execute(adminFound.id)

                return { isValid: true, token: token, refreshToken: refreshToken, statusCode: 403 }
            }





            //////// Expiração ////////

            //Checagem da expiração do Token encontrado
            const refreshTokenExpired = dayjs().isAfter(dayjs.unix(adminRefreshToken.expires_at))

            //Deleção dos RefreshTokens expirados
            if (refreshTokenExpired) {

                await prisma.refreshToken.deleteMany({
                    where: {
                        adminID: adminRefreshToken.adminID
                    }
                })
                const generateRefreshToken = new GenerateRefreshToken()
                const newRefreshToken = await generateRefreshToken.execute(adminRefreshToken.adminID)

                return { isValid: true, token: token, refreshToken: newRefreshToken, statusCode: 202 }
            }


            //////// Refresh Token existente e não expirado ////////
            // Retorno do novo token e refreshToken antigo que não foi expirado
            return { isValid: true, token: token, refreshToken: adminRefreshToken, statusCode: 202 }


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
