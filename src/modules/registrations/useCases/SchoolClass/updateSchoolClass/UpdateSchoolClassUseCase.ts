import { validationResponse } from "../../../../../types";
import { SchoolClass } from "../../../entities/SchoolClass";
import { ISchoolClassRepository } from "../../../repositories/ISchoolClassRepository";
import { checkBody } from "./UpdateSchoolClassCheck";
import { UpdateSchoolClassRequestProps } from "./UpdateSchoolClassController";

class UpdateSchoolClassUseCase {
    constructor(
        private schoolClassRepository: ISchoolClassRepository) { }

    async execute(schoolClassData: UpdateSchoolClassRequestProps, schoolClassID: SchoolClass["id"]): Promise<validationResponse> {

        // Validate the body sent from the frontend service
        // const bodyValidation = await checkBody(schoolClassData)


        // if (bodyValidation.isValid === false) {
        //     return ({
        //         isValid: false,
        //         statusCode: 403,
        //         errorMessage: bodyValidation.errorMessage,
        //     })
        // }

        // schoolClassData.selectiveStages.map( stage => {
        //     if (!stage.resultsDate) {
        //         stage.resultsDate = null
        //     }
        // })

        schoolClassData = {
            informations: {
                description: "Descrição 2311 teste 1516 o teste funciona vindo do front agora",
                observations:'teste',
                    whoCanParticipate: "anyone",
                        classContent: "class",
                            dateSchedule: "20/12/2311",
                                hourSchedule: "13h50",
                                    color: "#800080"
            },
            selectiveStages: [
                {
                    stagesID: "7adbeed2-1955-4158-84ea-c940eedf27d5",
                    when: "stage.when teste 2311",
                    description: "stage.description",
                    resultsDate: new Date()
                }
            ],
            status: "active",
            stripeProductID: "prod_P3jZV9lyolbJQn",
            title: "Período diurno teste 2311.0933",
            registrations: {
                description: "Descrição da matricula 2311.0933",
                value: 500
            },
            subscriptions: {
                status: "active",
                price: 3500,
                subscriptionSchedule: "subscriptionSchedule test"
            }
        }

        const upatedSchoolClassResponse = await this.schoolClassRepository.updateSchoolClass(schoolClassData, schoolClassID)

        return upatedSchoolClassResponse
    }

}

export { UpdateSchoolClassUseCase }