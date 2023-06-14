import { Prisma } from "@prisma/client";
import { prisma } from "../../../../prisma";
import { validationResponse } from "../../../../types";
import { Students, purcharsedSubscriptions } from "../../entities/Students";
import { CreateStudentRequestProps } from "../../useCases/Students/createStudents/CreateStudentsController";
import { UpdateStudentRequestProps } from "../../useCases/Students/updateStudents/UpdateStudentController";
import { IStudentsRepository } from "../IStudentsRepository";
import { StripeCustomer } from "../../../../hooks/StripeCustomer";
import { StripeFakeFront } from "../../../../hooks/StripeFakeFront";
import { ListStudentsQuery } from "../../useCases/Students/listStudents/ListStudentsController";


class StudentsRepository implements IStudentsRepository {

    private students: Students[]
    constructor() {
        this.students = [];
    }

    async filterStudent(
        { id, name, email, cpf, paymentStatus, schoolClassID, initDate, endDate }: ListStudentsQuery,
        page: number,
        pageRange: number
    ): Promise<validationResponse> {

        try {

            let filteredStudents = await prisma.students.findMany({
                where: {
                    AND: [
                        { id: id },
                        { name: name },
                        { email: email },
                        { cpf: cpf },
                    ]
                },
                skip: page * pageRange,
                take: pageRange
            })

            const studentsPerSchoolClass: Students[] = []
            filteredStudents.map(student => {
                const check = student.purcharsedSubscriptions.map(sub => {

                    if (sub.paymentDate) {


                        if ((new Date(endDate) > sub.paymentDate) && (sub.paymentDate > new Date(initDate))) {
                            return true
                        }

                        else {
                            return false
                        }
                    }
                })

                if (check.includes(true)) {
                    studentsPerSchoolClass.push(student)
                }
            })

            filteredStudents = studentsPerSchoolClass

            // Filtro por turma
            if (schoolClassID) {
                const studentsPerSchoolClass: Students[] = []

                filteredStudents.map(student => {

                    const check = student.purcharsedSubscriptions.map(sub => {

                        if (sub.schoolClassID == schoolClassID) {

                            if (!paymentStatus) {
                                return true

                            } else if (sub.paymentStatus == paymentStatus) {
                                return true
                            }
                        }
                        return false


                    })

                    if (check.includes(true)) {
                        studentsPerSchoolClass.push(student)
                    }

                })

                // studentsPerSchoolClass.filter(
                //     (v, i, a) => {
                //         console.log(v, i, a)
                //         a.findIndex(v2 => (v2.id === v.id)) === i
                //     }
                // )

                // // console.log(filteredStudents)



                return {
                    isValid: true,
                    statusCode: 202,
                    studentsList: studentsPerSchoolClass
                }
            }

            //Filtro apenas por status de pagamento
            if (paymentStatus && !schoolClassID) {
                const studentsPerPaymentStatus: Students[] = []

                filteredStudents.map(student => {

                    student.purcharsedSubscriptions.map(sub => {

                        if (sub.paymentStatus == paymentStatus) {
                            studentsPerPaymentStatus.push(student)
                        }
                    })
                })

                return {
                    isValid: true,
                    statusCode: 202,
                    studentsList: studentsPerPaymentStatus
                }
            }

            return {
                isValid: true,
                statusCode: 202,
                studentsList: filteredStudents
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

    async createStudent(studentData: CreateStudentRequestProps): Promise<validationResponse> {

        try {
            const searchedStudent = await prisma.students.findFirst({
                where: {
                    OR: [
                        { cpf: studentData.cpf },
                        { rg: studentData.rg }
                    ]
                }

            })

            // Buscando o RG e CPF do customer no Stripe
            const stripeCustomer = new StripeCustomer()
            const { cpf, rg } = studentData
            const stripeSearchedCustomerID = await stripeCustomer.searchCustomer(cpf, rg)


            //create stripe customer
            //pegar id do created stripe customer e atualizar o student ID
            if (searchedStudent && stripeSearchedCustomerID) {

                let subscriptionsDuplicated: Array<purcharsedSubscriptions["schoolClassID"]> = []

                studentData.pursharsedSubscriptions.map(
                    (subscription) => {

                        searchedStudent.purcharsedSubscriptions.map(
                            (subscriptionAlreadyRegistered) => {

                                if (subscriptionAlreadyRegistered.schoolClassID == subscription.schoolClassID
                                    &&
                                    subscriptionAlreadyRegistered.paymentStatus == "active"
                                ) {

                                    subscriptionsDuplicated.push(subscription.schoolClassID)
                                }
                            })
                    })


                if (subscriptionsDuplicated.length > 0) {

                    return {
                        isValid: false,
                        errorMessage: `Uma ou mais inscrições já foram compradas pelo estudante.`,
                        subscriptionsDuplicated: subscriptionsDuplicated,
                        statusCode: 403
                    }
                }

                //push student pursharsed subscriptions

                searchedStudent.purcharsedSubscriptions = [...searchedStudent.purcharsedSubscriptions, ...studentData.pursharsedSubscriptions]

                studentData.pursharsedSubscriptions.map((subscription) => {

                    searchedStudent.purcharsedSubscriptions.map(
                        (subscriptionAlreadyRegistered) => {

                            if (subscription.schoolClassID == subscriptionAlreadyRegistered.schoolClassID
                            ) {
                                subscriptionAlreadyRegistered.paymentDate = subscriptionAlreadyRegistered.paymentDate ?? null,
                                    subscriptionAlreadyRegistered.paymentMethod = subscriptionAlreadyRegistered.paymentMethod ?? 'Pagamento não confirmado',
                                    subscriptionAlreadyRegistered.paymentStatus = subscriptionAlreadyRegistered.paymentStatus ?? 'Pagamento não confirmado',
                                    subscriptionAlreadyRegistered.productID = subscriptionAlreadyRegistered.productID ?? 'Pagamento não confirmado',
                                    subscriptionAlreadyRegistered.productName = subscriptionAlreadyRegistered.productName ?? 'Pagamento não confirmado',
                                    subscriptionAlreadyRegistered.valuePaid = subscriptionAlreadyRegistered.valuePaid ?? 0

                            }
                        })

                })


                const updatedStudent = await prisma.students.update({
                    where: { id: searchedStudent.id },
                    data: {
                        name: studentData.name,
                        email: studentData.email,
                        gender: studentData.gender ?? 'Não informado',
                        birth: studentData.birth,
                        phoneNumber: studentData.phoneNumber,
                        country: studentData.country,
                        state: studentData.state,
                        city: studentData.city,

                        address: studentData.address,
                        cpf: studentData.cpf,
                        rg: studentData.rg,
                        selfDeclaration: studentData.selfDeclaration,
                        oldSchool: studentData.oldSchool,
                        oldSchoolAdress: studentData.oldSchoolAdress,
                        highSchoolGraduationDate: studentData.highSchoolGraduationDate,
                        highSchoolPeriod: studentData.highSchoolPeriod,
                        metUsMethod: studentData.metUsMethod,
                        exStudent: studentData.exStudent,
                        stripeCustomerID: stripeSearchedCustomerID,

                        purcharsedSubscriptions: searchedStudent.purcharsedSubscriptions
                    }
                })


                const stripeFrontEnd = new StripeFakeFront()
                studentData.pursharsedSubscriptions.map(async (subscription) => {

                    await stripeFrontEnd.createSubscription('', stripeSearchedCustomerID, cpf, rg, subscription.schoolClassID)
                })

                return {
                    isValid: true,
                    errorMessage: `Estudante atualizado com sucesso!`,
                    students: updatedStudent,
                    statusCode: 202
                }

            }


            // Student não encontrado no banco:
            const stripeCustomerCreatedID = await stripeCustomer.createCustomer(studentData)

            let studentSchoolClasses: purcharsedSubscriptions[] = []

            studentData.pursharsedSubscriptions.map((subscription) => {
                studentSchoolClasses.push({
                    schoolClassID: subscription.schoolClassID,
                    paymentDate: subscription.paymentDate ?? null,
                    paymentMethod: subscription.paymentMethod ?? 'Pagamento não confirmado',
                    paymentStatus: subscription.paymentStatus ?? 'Pagamento não confirmado',
                    productID: subscription.productID ?? 'Pagamento não confirmado',
                    productName: subscription.productName ?? 'Pagamento não confirmado',
                    valuePaid: subscription.valuePaid ?? 0
                })
            })

            const createdStudent = await prisma.students.create({
                data: {
                    name: studentData.name,
                    email: studentData.email,
                    gender: studentData.gender ?? 'Não informado',
                    birth: studentData.birth,
                    phoneNumber: studentData.phoneNumber,
                    isPhoneWhatsapp: studentData.isPhoneWhatsapp,
                    country: studentData.country,
                    state: studentData.state,
                    city: studentData.city,

                    address: studentData.address,
                    cpf: studentData.cpf,
                    rg: studentData.rg,
                    selfDeclaration: studentData.selfDeclaration,
                    oldSchool: studentData.oldSchool,
                    oldSchoolAdress: studentData.oldSchoolAdress,
                    highSchoolGraduationDate: studentData.highSchoolGraduationDate,
                    highSchoolPeriod: studentData.highSchoolPeriod,
                    metUsMethod: studentData.metUsMethod,
                    exStudent: studentData.exStudent,
                    stripeCustomerID: stripeCustomerCreatedID,

                    purcharsedSubscriptions: studentSchoolClasses
                }
            })


            ////TESTE SUBSCRIPTION
            const stripeFrontEnd = new StripeFakeFront()
            studentData.pursharsedSubscriptions.map(async (subscription) => {

                await stripeFrontEnd.createSubscription('', stripeCustomerCreatedID, cpf, rg, subscription.schoolClassID)
            })


            return {
                isValid: true,
                successMessage: `Estudante criado com sucesso!`,
                students: createdStudent,
                statusCode: 202
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

    async updateStudent(studentData: UpdateStudentRequestProps, studentID: Students["id"]): Promise<validationResponse> {
        try {

            const student = await prisma.students.findUnique({
                where: {
                    id: studentID
                }
            })

            if (!student) {
                return {
                    isValid: false,
                    errorMessage: 'Estudante não encontrado.',
                    statusCode: 404
                }
            }

            const updatedStudent = await prisma.students.update({
                where: {
                    id: studentID
                },
                data: {
                    ...studentData,
                }
            })
            return {
                isValid: true,
                statusCode: 202,
                students: updatedStudent
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

    async deleteStudent(studentID: string): Promise<validationResponse> {
        try {

            const student = await prisma.students.findFirst({
                where: {
                    id: studentID
                }
            })

            if (student) {

                try {

                    await prisma.students.delete({
                        where: {
                            id: studentID
                        }
                    })

                    return {
                        isValid: true,
                        statusCode: 202,
                        students: student,
                        successMessage: 'Estudante deletado com sucesso.'
                    }

                } catch {

                    return {
                        isValid: false,
                        statusCode: 403,
                        errorMessage: "Um erro ocorreu ao tentar excluir o estudante no banco de dados."
                    }
                }

            } else {

                return {
                    isValid: false,
                    statusCode: 403,
                    errorMessage: "Estudante não encontrado."
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

}

export { StudentsRepository }
