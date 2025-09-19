import { SchoolClass } from "../modules/registrations/entities/SchoolClass";
import { UpdateSchoolClassRequestProps } from "../modules/registrations/useCases/SchoolClass/updateSchoolClass/UpdateSchoolClassController";
import { prisma } from "../prisma";

async function getPrismaSchoolClass(schoolClassID:SchoolClass["id"]) {

    try {
        
        const schoolClass = await prisma.schoolClass.findUnique({
            where: {
                id: schoolClassID
            }
        })

        if (!schoolClass) {
            throw Error("Turma não encontrada.")
        }

        return schoolClass

    } catch (error) {
        throw error
    }
    
}

async function updatePrismaSchoolClass(schoolClassData: UpdateSchoolClassRequestProps, schoolClass:SchoolClass,  schoolClassID: SchoolClass["id"]) {

    try {

        const {selectiveStages, documents, subscriptions, informations, registrations} = schoolClassData
        

        const data: any = {
            title: schoolClassData.title ?? schoolClass.title,
            status: schoolClassData.status ?? schoolClass.status,
        };

        // Adiciona informations ao data apenas se ele for definido
        if (registrations) {
            data.registrations = {
                update: {
                    description: registrations.description?? schoolClass.registrations.description,
                    value: registrations.value?? schoolClass.registrations.value,
                }
            };

        }
        if (informations) {
            data.informations = {
                update: {
                    description: informations.description?? schoolClass.informations.description,
                    whoCanParticipate: informations.whoCanParticipate?? schoolClass.informations.whoCanParticipate,
                    observations: informations.observations?? schoolClass.informations.observations,
                    classContent: informations.classContent?? schoolClass.informations.classContent,
                    dateSchedule: informations.dateSchedule?? schoolClass.informations.dateSchedule,
                    hourSchedule: informations.hourSchedule?? schoolClass.informations.hourSchedule,
                    color: informations.color?? schoolClass.informations.color,
                }
            };

        }

        if (subscriptions) {
            data.subscriptions = {
                update: {
                    status:subscriptions.status,
                    price: schoolClass.subscriptions.price,
                    subscriptionSchedule:subscriptions.subscriptionSchedule
                }
            };

        }
        if (selectiveStages) {
            data.selectiveStages = {
                updateMany: {
                    where: { stagesID: selectiveStages.stagesID },
                    data: selectiveStages
                }
            };
        }

        // Adiciona documents ao data apenas se ele for definido
        if (documents) {
            data.documents = {
                updateMany: {
                    where: { docsID: documents.docsID },
                    data: documents
                }
            };
        }

        const updatedSchoolClass = await prisma.schoolClass.update({
            where: { id: schoolClassID },
            data: data // Usa o objeto data construído dinamicamente
        });

        if (!updatedSchoolClass) {
            throw Error("Turma não encontrada.")
        }

        return updatedSchoolClass

    } catch (error) {
        throw error
    }
    
}

export {
    getPrismaSchoolClass,
    updatePrismaSchoolClass
}