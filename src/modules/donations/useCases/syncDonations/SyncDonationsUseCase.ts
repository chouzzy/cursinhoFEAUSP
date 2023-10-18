import { validationResponse } from "../../../../types"
import { Donations } from "../../entities/Donations"
import { IDonationsRepository } from "../../repositories/IDonationsRepository"
import { checkQuery } from "./SyncDonationsCheck"
//////

class SyncDonationsUseCase {
    constructor(
        private donationsRepository: IDonationsRepository) { }

    async execute(): Promise<validationResponse> {

        const donations = await this.donationsRepository.syncDonations()
        return donations
    }
}

export { SyncDonationsUseCase }
