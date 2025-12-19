import { Request, Response } from "express";
import { StripeInscriptionService } from "../services/StripeInscriptionService";

export class StripeInscriptionController {
  async handle(req: Request, res: Response) {
    const inscriptionData = req.body;

    if (!inscriptionData) {
      return res.status(400).json({ error: "Dados de inscrição obrigatórios." });
    }

    const service = new StripeInscriptionService();

    try {
      const result = await service.createCheckoutSession(inscriptionData);
      return res.json(result);
    } catch (error: any) {
      console.error("Erro ao criar Checkout de Inscrição:", error);
      return res.status(500).json({ error: "Erro ao processar pagamento via cartão." });
    }
  }
}