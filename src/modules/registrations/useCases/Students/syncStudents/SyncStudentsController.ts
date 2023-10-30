import { Request, Response } from "express";
import { SyncStudentsUseCase } from "./SyncStudentsUseCase";
import { StudentsRepository } from "../../../repositories/implementations/StudentsRepository";



class SyncStudentsController {
    async handle(req: Request, res: Response): Promise<Response> {

        // Instanciando o useCase no repositório com as funções
        const donationsRepository = new StudentsRepository()
        
        const syncStudentsUseCase = new SyncStudentsUseCase(donationsRepository);
        
        const response = await syncStudentsUseCase.execute()
        
        return res.status(response.statusCode).json(response)

    }
}

export {SyncStudentsController}