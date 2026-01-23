import { Request, Response } from "express";
import { StripeInscriptionService } from "../services/StripeInscriptionService";
import { AsaasService } from "../services/AsaasService"; // Importe o serviço do Asaas

export class StripeInscriptionController {
  async handle(req: Request, res: Response) {
    const inscriptionData = req.body;

    if (!inscriptionData) {
      return res.status(400).json({ error: "Dados de inscrição obrigatórios." });
    }

    const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'stripe';

    try {
      let result;

      if (PAYMENT_PROVIDER === 'asaas') {
          console.log("Usando processador de pagamento (Inscrição): ASAAS");
          const asaasService = new AsaasService();
          
          // Mapear inscriptionData para o formato esperado pelo AsaasService
          // Note que o AsaasService precisa ser capaz de lidar com a lógica de 'inscription'
          result = await asaasService.createPaymentSession({
              name: `${inscriptionData.nome} ${inscriptionData.sobrenome}`,
              email: inscriptionData.email,
              cpf: inscriptionData.cpf,
              phone: inscriptionData.phoneNumber,
              value: Math.round(Number(inscriptionData.price) * 100), // Centavos
              interval: 'one_time',
              cycles: 1,
              productName: 'Taxa de Inscrição - Cursinho FEA USP',
              // Passamos os dados extras para o AsaasService salvar no banco corretamente
              ...inscriptionData,
              type: 'inscription' // Flag para o serviço saber que é inscrição
          });

      } else {
          console.log("Usando processador de pagamento (Inscrição): STRIPE");
          const stripeService = new StripeInscriptionService();
          result = await stripeService.createCheckoutSession(inscriptionData);
      }

      return res.json(result);
    } catch (error: any) {
      console.error("Erro ao criar Checkout de Inscrição:", error);
      return res.status(500).json({ error: "Erro ao processar pagamento via cartão." });
    }
  }
}