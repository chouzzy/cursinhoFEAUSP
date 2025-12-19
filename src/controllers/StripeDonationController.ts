import { Request, Response } from "express";
import { StripeDonationService } from "../services/StripeDonationService";

export class StripeDonationController {
  
  async handle(req: Request, res: Response) {
    const { 
      name, email, cpf, phone, value, interval, cycles,
      rg, ufrg, gender, birth, isPhoneWhatsapp,
      zipCode, street, homeNumber, complement, district, city, state
    } = req.body;

    console.log(`[StripeController] Recebido: interval=${interval}, cycles=${cycles}, value=${value}`);

    if (!name || !email || !value) {
      return res.status(400).json({ error: "Dados incompletos. Nome, email e valor são obrigatórios." });
    }

    const service = new StripeDonationService();

    try {
      // Normalização rigorosa
      // Se interval vier 'monthly', é mensal.
      const isMonthly = interval === 'monthly';
      
      // Se for mensal:
      // cycles = 0 -> Indeterminado (Assinatura)
      // cycles > 1 -> Determinado (Assinatura)
      // cycles = 1 -> Única (Pagamento)
      
      // Garantindo que cycles seja um número. Se não vier, assume 0 (indeterminado) para mensal.
      const cyclesNumber = isMonthly ? (cycles !== undefined ? Number(cycles) : 0) : 1;

      const result = await service.createCheckoutSession({
        name,
        email,
        cpf,
        phone,
        value: Number(value),
        
        // Passamos 'month' apenas se for mensal E não for 1 ciclo (que seria cobrado como único)
        // Mas sua regra de negócio diz que > 1 ou 0 é mensal.
        interval: isMonthly ? 'month' : 'one_time', 
        cycles: cyclesNumber, 

        productName: isMonthly 
            ? (cyclesNumber === 0 ? 'Doação Mensal (Recorrente)' : `Doação Mensal (${cyclesNumber} meses)`) 
            : 'Doação Única - Cursinho FEA',
        
        rg, ufrg, gender, birth, isPhoneWhatsapp,
        zipCode, street, homeNumber, complement, district, city, state
      });

      return res.json(result);

    } catch (error: any) {
      console.error("Erro ao criar Checkout Session:", error);
      return res.status(500).json({ error: "Erro ao processar doação via Stripe." });
    }
  }

  // (Método handlePortal permanece inalterado)
  async handlePortal(req: Request, res: Response) {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "E-mail é obrigatório." });
    const service = new StripeDonationService();
    try {
      await service.sendCustomerPortalLink(email);
      return res.json({ success: true, message: "Se o e-mail estiver cadastrado, você receberá o link em instantes." });
    } catch (error: any) {
      console.error("Erro ao gerar link do portal:", error.message);
      return res.json({ success: true, message: "Se o e-mail estiver cadastrado, você receberá o link em instantes." });
    }
  }
}