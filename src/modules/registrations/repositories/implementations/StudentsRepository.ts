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


interface purcharsedSubscriptionsID {
    schoolClassID: string
}

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
            if (page == 0) {
                page = 1
            }


            let filteredStudents = await prisma.students.findMany({
                where: {
                    AND: [
                        { id: id },
                        { name: { contains: name } },
                        { email: email },
                        { cpf: cpf },
                    ]
                },
                skip: (page - 1) * pageRange,
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


                return {
                    isValid: true,
                    statusCode: 202,
                    studentsList: studentsPerSchoolClass,
                    totalDocuments: studentsPerSchoolClass.length
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
                    studentsList: studentsPerPaymentStatus,
                    totalDocuments: studentsPerPaymentStatus.length
                }
            }

            return {
                isValid: true,
                statusCode: 202,
                studentsList: filteredStudents,
                totalDocuments: filteredStudents.length
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

            //Checa duplicados no array purcharsed subs
            function checkDuplicateSchoolClassIDs(purcharsedSubscriptions: Students["purcharsedSubscriptions"]) {
                const uniqueIDs = new Set();

                for (const subscription of purcharsedSubscriptions) {
                    if (uniqueIDs.has(subscription.schoolClassID)) {
                        return true; // Duplicate found
                    }
                    uniqueIDs.add(subscription.schoolClassID);
                }

                return false; // No duplicates found
            }

            const { purcharsedSubscriptions } = studentData

            const hasDuplicateSchoolClassIDs = checkDuplicateSchoolClassIDs(purcharsedSubscriptions);

            if (hasDuplicateSchoolClassIDs) {
                return {
                    isValid: false,
                    errorMessage: `Não é possível comprar a mesma inscrição duas vezes.`,
                    statusCode: 403
                }
            }


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
            const stripeSearchedCustomerID = await stripeCustomer.searchCustomer(cpf, null)


            //create stripe customer
            //pegar id do created stripe customer e atualizar o student ID


            if (searchedStudent && stripeSearchedCustomerID) {


                let subscriptionsDuplicated: Array<purcharsedSubscriptions["schoolClassID"]> = []

                //Filtro para possível cadastro em turma que já foi paga.
                studentData.purcharsedSubscriptions.map(
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

                //push student purcharsed subscriptions
                const isDuplicatedInactiveSubscription = checkDuplicateSchoolClassIDs(
                    [...searchedStudent.purcharsedSubscriptions,
                    ...studentData.purcharsedSubscriptions
                    ])

                //Caso tenha subscription já comprada, mas que o pagamento não foi confirmado, será feito o fake front novamente (pagamento dnv)
                if (isDuplicatedInactiveSubscription) {

                    const stripeFrontEnd = new StripeFakeFront()
                    await stripeFrontEnd.createSubscription({
                        stripeCustomerID: stripeSearchedCustomerID,
                        cpf: cpf,
                        rg: rg,
                        schoolClassID: studentData.purcharsedSubscriptions[0].schoolClassID
                    })

                    return {
                        isValid: true,
                        errorMessage: `Estudante atualizado com sucesso!`,
                        students: searchedStudent,
                        statusCode: 202
                    }

                }

                console.log('searchedStudent')
                console.log(searchedStudent)
                console.log('studentData')
                console.log(studentData)

                // Só vaic hegar aqui a inscrição
                studentData.purcharsedSubscriptions = [{
                    schoolClassID: studentData.purcharsedSubscriptions[0].schoolClassID,
                    paymentDate: null,
                    paymentMethod: 'Pagamento não confirmado',
                    paymentStatus: 'Pagamento não confirmado',
                    productID: 'Pagamento não confirmado',
                    productName: 'Pagamento não confirmado',
                    valuePaid: 0
                }]

                searchedStudent.purcharsedSubscriptions = [...searchedStudent.purcharsedSubscriptions, ...studentData.purcharsedSubscriptions]


                console.log('searchedStudent pós junção')
                console.log(searchedStudent)


                // studentData.purcharsedSubscriptions.map((subscription) => {

                //     searchedStudent.purcharsedSubscriptions.map(
                //         (subscriptionAlreadyRegistered) => {

                //             if (subscription.schoolClassID == subscriptionAlreadyRegistered.schoolClassID
                //             ) {
                //                 subscriptionAlreadyRegistered.paymentDate = subscriptionAlreadyRegistered.paymentDate ?? null,
                //                     subscriptionAlreadyRegistered.paymentMethod = subscriptionAlreadyRegistered.paymentMethod ?? 'Pagamento não confirmado',
                //                     subscriptionAlreadyRegistered.paymentStatus = subscriptionAlreadyRegistered.paymentStatus ?? 'Pagamento não confirmado',
                //                     subscriptionAlreadyRegistered.productID = subscriptionAlreadyRegistered.productID ?? 'Pagamento não confirmado',
                //                     subscriptionAlreadyRegistered.productName = subscriptionAlreadyRegistered.productName ?? 'Pagamento não confirmado',
                //                     subscriptionAlreadyRegistered.valuePaid = subscriptionAlreadyRegistered.valuePaid ?? 0

                //             }
                //         })

                // })




                const updatedStudent = await prisma.students.update({
                    where: { id: searchedStudent.id },
                    data: {
                        name: searchedStudent.name,
                        email: searchedStudent.email,
                        gender: searchedStudent.gender,
                        birth: searchedStudent.birth,
                        phoneNumber: searchedStudent.phoneNumber,
                        state: searchedStudent.state,
                        city: searchedStudent.city,
                        street: searchedStudent.street,
                        homeNumber: searchedStudent.homeNumber,
                        complement: searchedStudent.complement,
                        district: searchedStudent.district,
                        zipCode: searchedStudent.zipCode,
                        isPhoneWhatsapp: searchedStudent.isPhoneWhatsapp,
                        cpf: searchedStudent.cpf,
                        rg: searchedStudent.rg,
                        ufrg: searchedStudent.ufrg,
                        selfDeclaration: searchedStudent.selfDeclaration,
                        oldSchool: searchedStudent.oldSchool,
                        oldSchoolAdress: searchedStudent.oldSchoolAdress,
                        highSchoolGraduationDate: searchedStudent.highSchoolGraduationDate,
                        highSchoolPeriod: searchedStudent.highSchoolPeriod,
                        metUsMethod: searchedStudent.metUsMethod,
                        exStudent: searchedStudent.exStudent,
                        purcharsedSubscriptions: searchedStudent.purcharsedSubscriptions
                    }
                })


                const stripeFrontEnd = new StripeFakeFront()
                studentData.purcharsedSubscriptions.map(async (subscription) => {

                    await stripeFrontEnd.createSubscription({
                        stripeCustomerID: stripeSearchedCustomerID,
                        cpf: cpf,
                        rg: rg,
                        schoolClassID: subscription.schoolClassID
                    })
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



            studentData.purcharsedSubscriptions.map((subscription) => {
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
                    state: studentData.state,

                    city: studentData.city,
                    street: studentData.street,
                    homeNumber: studentData.homeNumber,
                    complement: studentData.complement ?? 'Não informado',
                    district: studentData.district,
                    zipCode: studentData.zipCode,

                    cpf: studentData.cpf,
                    rg: studentData.rg,
                    ufrg: studentData.ufrg,
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
            studentData.purcharsedSubscriptions.map(async (subscription) => {

                await stripeFrontEnd.createSubscription({
                    stripeCustomerID: stripeCustomerCreatedID,
                    cpf: cpf,
                    rg: rg,
                    schoolClassID: subscription.schoolClassID
                })
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
