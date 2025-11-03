import { prisma } from "../prisma";
import { DiscountCoupon } from "@prisma/client";

interface CreateCouponData {
  code: string;
  discountValue: number;
  isActive?: boolean;
}

interface UpdateCouponData {
  isActive?: boolean;
  maxUses?: number;
}

export class CouponService {

  /**
   * Cria um novo cupom de desconto.
   */
  async create(data: CreateCouponData): Promise<DiscountCoupon> {
    // Verifica se o código do cupom já existe
    const existingCoupon = await prisma.discountCoupon.findUnique({
      where: { code: data.code }
    });

    if (existingCoupon) {
      throw new Error('Já existe um cupom com este código.');
    }

    const coupon = await prisma.discountCoupon.create({
      data: {
        code: data.code,
        discountValue: data.discountValue,
        isActive: data.isActive ?? true, // Padrão é 'ativo'
      }
    });
    return coupon;
  }

  /**
   * Lista todos os cupons existentes.
   */
  async list(): Promise<DiscountCoupon[]> {
    const coupons = await prisma.discountCoupon.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    return coupons;
  }

  /**
   * Atualiza um cupom (ex: para desativá-lo)
   */
  async update(id: string, data: UpdateCouponData): Promise<DiscountCoupon> {
    const coupon = await prisma.discountCoupon.update({
      where: { id: id },
      data: data
    });
    return coupon;
  }

  /**
   * Deleta um cupom.
   */
  async delete(id: string): Promise<void> {
    await prisma.discountCoupon.delete({
      where: { id: id }
    });
  }
}

