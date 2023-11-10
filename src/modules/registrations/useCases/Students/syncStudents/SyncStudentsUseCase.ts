
import { validationResponse } from "../../../../../types"
import { IStudentsRepository } from "../../../repositories/IStudentsRepository"
//////

class SyncStudentsUseCase {
    constructor(
        private studentsRepository: IStudentsRepository) { }

    async execute(): Promise<validationResponse> {

        const donations = await this.studentsRepository.syncStudents()
        return donations
    }
}

export { SyncStudentsUseCase }
