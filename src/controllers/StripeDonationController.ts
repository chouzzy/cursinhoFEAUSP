import { Request, Response } from "express";
import { StripeDonationService } from "../services/StripeDonationService";
import { AsaasService } from "../services/AsaasService";
import jwt from 'jsonwebtoken';

export class StripeDonationController {

  // ... (método handle de checkout existente) ...
  async handle(req: Request, res: Response) {
    // ... (código existente de criação de checkout)
    console.log("Dados recebidos para doação:", req.body);
    const {
      name, email, cpf, phone, value, interval, cycles,
      rg, ufrg, gender, birth, isPhoneWhatsapp,
      zipCode, street, homeNumber, complement, district, city, state
    } = req.body;


    if (!name || !email || !value) {
      return res.status(400).json({ error: "Dados incompletos. Nome, email e valor são obrigatórios." });
    }

    const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'stripe';

    try {
      let result;

      if (PAYMENT_PROVIDER === 'asaas') {
        console.log("Usando processador de pagamento: ASAAS");
        const asaasService = new AsaasService();

        result = await asaasService.createPaymentSession({
          name, email, cpf, phone,
          value: Number(value), // Centavos
          interval: interval === 'monthly' ? 'month' : 'one_time',
          cycles: interval === 'monthly' ? (Number(cycles) || 0) : 1,
          productName: interval === 'monthly' ? 'Doação Mensal - Cursinho FEA' : 'Doação Única',
          rg, ufrg, gender, birth, isPhoneWhatsapp,
          zipCode, street, homeNumber, complement, district, city, state,
          type: 'donation'
        });

      } else {
        console.log("Usando processador de pagamento: STRIPE");
        const stripeService = new StripeDonationService();

        result = await stripeService.createCheckoutSession({
          name, email, cpf, phone,
          value: Number(value),
          interval: interval === 'monthly' ? 'month' : 'one_time',
          cycles: interval === 'monthly' ? (Number(cycles) || 0) : 1,
          productName: interval === 'monthly' ? 'Doação Mensal - Cursinho FEA' : 'Doação Única - Cursinho FEA',
          rg, ufrg, gender, birth, isPhoneWhatsapp,
          zipCode, street, homeNumber, complement, district, city, state
        });
      }

      return res.json(result);

    } catch (error: any) {
      console.error("Erro ao processar doação:", error);
      return res.status(500).json({ error: "Erro ao processar pagamento." });
    }
  }

  // 1. Enviar Magic Link
  async handlePortal(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "E-mail é obrigatório." });

    const PAYMENT_PROVIDER = process.env.PAYMENT_PROVIDER || 'stripe';

    try {
      if (PAYMENT_PROVIDER === 'asaas') {
        const asaasService = new AsaasService();
        await asaasService.sendMagicLink(email);
      } else {
        // Mantém o portal do Stripe se estiver usando Stripe
        const service = new StripeDonationService();
        await service.sendCustomerPortalLink(email);
      }
      return res.json({ success: true, message: "Link enviado." });
    } catch (error: any) {
      console.error("Erro portal:", error.message);
      return res.json({ success: true, message: "Link enviado." });
    }
  }

  async getSubscriptionInfo(req: Request, res: Response) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token ausente' });

    try {
      const decoded = jwt.verify(token, process.env.TOKEN_PRIVATE_KEY || 'secret') as any;
      const { email } = decoded; // Pegamos o email

      if (process.env.PAYMENT_PROVIDER === 'asaas') {
        const asaasService = new AsaasService();
        // Retorna ARRAY de assinaturas
        const info = await asaasService.listSubscriptions(email);
        return res.json(info);
      }

      // Se for Stripe, não deveríamos estar aqui (usa portal nativo), mas podemos retornar erro
      return res.status(400).json({ error: 'Use o portal do Stripe.' });

    } catch (err) {
      return res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
  }

  // 3. Cancelar Assinatura
  async cancelSubscription(req: Request, res: Response) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token ausente' });

    try {
      const decoded = jwt.verify(token, process.env.TOKEN_PRIVATE_KEY || 'secret') as any;
      const { email } = decoded;
      const { donationId } = req.body; // Recebe qual ID cancelar

      if (process.env.PAYMENT_PROVIDER === 'asaas') {
        const asaasService = new AsaasService();
        // Passa email para validar
        await asaasService.cancelSubscription(donationId, email);
        return res.json({ success: true });
      }

      return res.status(400).json({ error: 'Operação não suportada para este provedor.' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao cancelar.' });
    }
  }
}