import { Prisma } from "@prisma/client";
import { prisma } from "../../../../prisma";
import { validationResponse } from "../../../../types";
import { DocumentsTypes, SchoolClass, SchoolClassSelectiveStages } from "../../entities/SchoolClass";
import { CreateSchoolClassRequestProps } from "../../useCases/SchoolClass/createSchoolClass/CreateSchoolClassController";
import { UpdateSchoolClassRequestProps } from "../../useCases/SchoolClass/updateSchoolClass/UpdateSchoolClassController";
import { ISchoolClassRepository } from "../ISchoolClassRepository";
import { StripeProducts } from "../../../../hooks/StripeProducts";
import { CreateSchoolClassDocsRequestProps } from "../../useCases/SchoolClass/createSchoolClassDocs/CreateSchoolClassDocsController";
import { Students } from "../../entities/Students";
import { CreateSchoolClassStagesRequestProps } from "../../useCases/SchoolClass/createSchoolClassStages/CreateSchoolClassStagesController";
import { v4 as uuidV4, v4 } from "uuid";


class SchoolClassRepository implements ISchoolClassRepository {

    private SchoolClass: SchoolClass[]
    constructor() {
        this.SchoolClass = [];
    }

    async createSchoolClass(
        schoolClassData: CreateSchoolClassRequestProps
    ): Promise<validationResponse> {

        try {

            //busca usuario no banco pra ve se existe
            const schoolClassFound = await prisma.schoolClass.findFirst({
                where: {
                    OR: [
                        { title: schoolClassData.title },
                    ],
                },
            })

            
            if (schoolClassFound) {
                return { isValid: false, errorMessage: `Título de turma já existente`, statusCode: 403 }
            }

            schoolClassData.documents?.map(doc => {
                doc.docsID = uuidV4()
            })

            schoolClassData.selectiveStages.map(stage => {
                stage.stagesID = uuidV4()
            })

            const createdSchoolClass = await prisma.schoolClass.create({
                data: schoolClassData
            })
            return { isValid: true, statusCode: 202, schoolClass: createdSchoolClass }


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

    async listAllSchoolClasses(title: SchoolClass["title"]): Promise<validationResponse> {

        try {

            const allSchoolClasses = await prisma.schoolClass.findMany({
                where: {
                    OR:[
                        {title: {contains:title}}
                    ]
                },
                select:{
                    id: true,
                    title: true
                }
            })


            return {
                isValid: true,
                statusCode: 202,
                listAllSchoolClassList: allSchoolClasses?? []
            }

        } catch (error: unknown) {

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return { isValid: false, errorMessage: error, statusCode: 403 }

            } else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }

    async listSchoolClasses(page: number, pageRange: number): Promise<validationResponse> {

        try {

            if (page == 0) {
                page = 1
            }

            const allSchoolClasses = await prisma.schoolClass.findMany({
                skip: (page - 1) * pageRange,
                take: pageRange
            })

            return {
                isValid: true,
                statusCode: 202,
                schoolClassList: allSchoolClasses,
                totalDocuments: allSchoolClasses.length
            }

        } catch (error: unknown) {

            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return { isValid: false, errorMessage: error, statusCode: 403 }

            } else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }

    async updateSchoolClass(
        schoolClassData: UpdateSchoolClassRequestProps,
        schoolClassID: SchoolClass["id"],
        stripeProductID?: SchoolClass["stripeProductID"] //enviado apenas na criação de um schoolClass, nunca num update
    ): Promise<validationResponse> {

        try {
            const schoolClass = await prisma.schoolClass.findUnique({
                where: {
                    id: schoolClassID
                }
            })

            if (!schoolClass) {
                return { isValid: false, errorMessage: 'Turma não encontrada.', statusCode: 403 }
            }

            //Se tiver o product ID, iremos atualizá-lo, pois se trata de um update do webhook
            
            if (stripeProductID) {
                const updatedSchoolClass = await prisma.schoolClass.update({
                    where: {
                        id: schoolClassID
                    },
                    data: {
                        stripeProductID: stripeProductID ?? schoolClass.stripeProductID
                    }
                })

                return {
                    isValid: true,
                    statusCode: 202,
                    successMessage: 'Turma criada no servidor Stripe e atualizada com sucesso no banco de dados.',
                    schoolClass: updatedSchoolClass
                }
            }


            // Não há atualização de documents e nem de stripe ID, apenas um simples update de outros dados
            const updatedSchoolClass = await prisma.schoolClass.update({
                where: {
                    id: schoolClassID
                },
                data: schoolClassData
            })


            return {
                isValid: true,
                statusCode: 202,
                successMessage: "Turma atualizada com sucesso",
                schoolClass: updatedSchoolClass
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

    async deleteSchoolClass(schoolClassID: string): Promise<validationResponse> {

        try {


            const schoolClass = await prisma.schoolClass.findUnique({
                where: {
                    id: schoolClassID
                }
            })


            if (schoolClass) {

                try {

                    const stripeProducts = new StripeProducts()

                    await stripeProducts.deleteProduct(schoolClass.stripeProductID)

                    await prisma.schoolClass.delete({
                        where: {
                            id: schoolClassID
                        }
                    })

                    return {
                        isValid: true,
                        successMessage: 'Estudante deletado com sucesso',
                        statusCode: 202,
                        schoolClass: schoolClass
                    }

                } catch {

                    return {
                        isValid: false,
                        statusCode: 403,
                        errorMessage: "Um erro ocorreu ao tentar excluir a turma do banco de dados"
                    }
                }

            } else {

                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "Turma não encontrada no banco de dados"
                }
            }

        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                return { isValid: false, errorMessage: error, statusCode: 403 }

            } else {
                return { isValid: false, errorMessage: String(error), statusCode: 403 }
            }
        }
    }

    async createDocs(schoolClassDocsData: CreateSchoolClassDocsRequestProps[], schoolClassID: Students["id"]): Promise<validationResponse> {

        try {
            const schoolClass = await prisma.schoolClass.findFirst({
                where: { id: schoolClassID }
            })

            if (!schoolClass) {
                return {
                    isValid: false,
                    errorMessage: "Turma não encontrada.",
                    statusCode: 403
                }
            }

            // Registrating UUID for each document
            const docsWithID = schoolClassDocsData.map(doc => {
                return {
                    docsID: uuidV4(),
                    title: doc.title,
                    downloadLink: doc.downloadLink,
                }
            })


            const documentsReadyToUpdate = [...schoolClass.documents, ...docsWithID]

            //Grouping the documents titles to check if it is duplicated
            const docsTitles = documentsReadyToUpdate.map(doc => {
                return doc.title
            })

            // Checking duplicated titles
            const titleAlreadyRegistered = docsTitles.some((item, index) => {
                return docsTitles.indexOf(item) != index
            })

            //if duplicated, we'll return false
            if (titleAlreadyRegistered) {
                return {
                    isValid: false,
                    errorMessage: "Título já existente",
                    statusCode: 403
                }
            }

            // Updating the documents
            const schoolClassUpdated = await prisma.schoolClass.update({
                where: { id: schoolClassID },
                data: {
                    documents: documentsReadyToUpdate
                }
            })

            return {
                isValid: true,
                successMessage: "Document was successfully registered",
                statusCode: 201,
                schoolClassDocs: schoolClassUpdated.documents,
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

    async createStages(schoolClassStagesData: CreateSchoolClassStagesRequestProps[], schoolClassID: Students["id"]): Promise<validationResponse> {

        try {

            const schoolClass = await prisma.schoolClass.findFirst({
                where: { id: schoolClassID }
            })

            if (!schoolClass) {
                return {
                    isValid: false,
                    errorMessage: "Turma não encontrada",
                    statusCode: 403
                }
            }

            // Registrating UUID for each document

            const stagesWithID = schoolClassStagesData.map(stage => {


                if (stage.resultsDate != null) {
                    stage.resultsDate = new Date(stage.resultsDate)
                    console.log('é null')
                }
                return {
                    stagesID: uuidV4(),
                    when: stage.when,
                    resultsDate: stage.resultsDate,
                    description: stage.description,
                }
            })


            const stagesToUpdate = [...stagesWithID, ...schoolClass.selectiveStages]

            const schoolClassUpdated = await prisma.schoolClass.update({
                where: { id: schoolClassID },
                data: {
                    selectiveStages: stagesToUpdate
                }
            })

            return {
                isValid: true,
                successMessage: "Documento registrado com sucesso.",
                statusCode: 201,
                schoolClassStages: schoolClassUpdated.selectiveStages
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

    async deleteDocs(docsID: DocumentsTypes["docsID"], schoolClassID: SchoolClass["id"]): Promise<validationResponse> {

        try {
            const schoolClass = await prisma.schoolClass.findFirst({
                where: { id: schoolClassID }
            })

            if (!schoolClass) {
                return {
                    isValid: false,
                    errorMessage: 'Turma não encontrada.',
                    statusCode: 404
                }
            }

            const docExists = schoolClass.documents.filter((doc) => {
                console.log(doc.docsID, docsID)
                return doc.docsID === docsID
            })

            if (docExists.length == 0) {
                return {
                    isValid: false,
                    errorMessage: 'Documento não encontrado',
                    statusCode: 404
                }
            }

            const remainingDocs = schoolClass.documents.filter((doc) => {
                return doc.docsID != docsID
            })

            const deletedDoc = await prisma.schoolClass.update({
                where: { id: schoolClassID },
                data: {
                    documents: remainingDocs
                }
            })

            return {
                isValid: true,
                successMessage: 'Documento excluído com sucesso.',
                statusCode: 201
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

    async deleteStages(stagesID: SchoolClassSelectiveStages["stagesID"], schoolClassID: SchoolClass["id"]): Promise<validationResponse> {

        try {
            const schoolClass = await prisma.schoolClass.findFirst({
                where: { id: schoolClassID }
            })

            if (!schoolClass) {
                return {
                    isValid: false,
                    errorMessage: 'Turma não encontrada',
                    statusCode: 404
                }
            }

            const stageExists = schoolClass.selectiveStages.filter((stage) => {
                console.log(stage.stagesID, stagesID)
                return stage.stagesID === stagesID
            })

            if (stageExists.length == 0) {
                return {
                    isValid: false,
                    errorMessage: 'Etapa não encontrada',
                    statusCode: 404
                }
            }

            const remainingStages = schoolClass.selectiveStages.filter((stage) => {
                return stage.stagesID != stagesID
            })

            const deletedStage = await prisma.schoolClass.update({
                where: { id: schoolClassID },
                data: {
                    selectiveStages: remainingStages
                }
            })

            return {
                isValid: true,
                successMessage: 'Selective Stage deleted successfully',
                statusCode: 201
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

}

export { SchoolClassRepository }
