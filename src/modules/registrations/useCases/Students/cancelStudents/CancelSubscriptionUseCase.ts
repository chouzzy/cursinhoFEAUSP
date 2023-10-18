import { validationResponse } from "../../../../../types";
import { Students } from "../../../entities/Students";
import { IStudentsRepository } from "../../../repositories/IStudentsRepository";
import { checkParams } from "./CancelSubscriptionCheck";

class CancelSubscriptionUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) {}

    async execute(studentID:Students["id"], stripeSubscriptionID:Students["purcharsedSubscriptions"][0]["stripeSubscriptionID"]): Promise<validationResponse> {
        

        const bodyValidation = await checkParams(studentID, stripeSubscriptionID)

        if (bodyValidation.isValid === false) {
            return ({
                isValid: false,
                statusCode: 403,
                errorMessage: bodyValidation.errorMessage,
            })
        }

        const canceledSubscription = await this.studentsRepository.cancelSubscription(studentID, stripeSubscriptionID)
        
        return canceledSubscription
    }
    
}

export {CancelSubscriptionUseCase}