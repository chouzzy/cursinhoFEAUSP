import { Router, Request, Response } from "express";
import { CouponService } from "../services/CouponService";
// Importando o seu middleware de autenticação existente
import { ensureAuthenticated } from "../modules/registrations/middleware/ensureAuthenticate"; 

const couponRoutes = Router();
const couponService = new CouponService();

// --- ROTAS DE CUPOM (PROTEGIDAS COM SEU MIDDLEWARE) ---

/**
 * Rota: POST /coupons
 * Descrição: Cria um novo cupom de desconto.
 * Protegida: Sim (Admin)
 */
couponRoutes.post('/', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const coupon = await couponService.create(req.body);
    return res.status(201).json(coupon);
  } catch (error: any) {
    if (error.message.includes('Já existe')) {
      return res.status(409).json({ error: error.message });
    }
    return res.status(500).json({ error: 'Falha ao criar cupom.' });
  }
});

/**
 * Rota: GET /coupons
 * Descrição: Lista todos os cupons de desconto.
 * Protegida: Sim (Admin)
 */
couponRoutes.get('/', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const coupons = await couponService.list();
    return res.status(200).json(coupons);
  } catch (error: any) {
    return res.status(500).json({ error: 'Falha ao listar cupons.' });
  }
});

/**
 * Rota: PUT /coupons/:id
 * Descrição: Atualiza um cupom (ex: desativar).
 * Protegida: Sim (Admin)
 */
couponRoutes.put('/:id', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    const coupon = await couponService.update(req.params.id, req.body);
    return res.status(200).json(coupon);
  } catch (error: any) {
    return res.status(500).json({ error: 'Falha ao atualizar cupom.' });
  }
});

/**
 * Rota: DELETE /coupons/:id
 * Descrição: Deleta um cupom de desconto.
 * Protegida: Sim (Admin)
 */
couponRoutes.delete('/:id', ensureAuthenticated, async (req: Request, res: Response) => {
  try {
    await couponService.delete(req.params.id);
    return res.status(204).send(); // 204 No Content
  } catch (error: any) {
    return res.status(500).json({ error: 'Falha ao deletar cupom.' });
  }
});


export { couponRoutes };
