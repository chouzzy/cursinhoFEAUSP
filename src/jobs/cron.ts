import cron from 'node-cron';
import { AutomationService } from '../services/AutomationService';

const automationService = new AutomationService();

export function startCronJobs() {
  console.log('🚀 Serviços de Agendamento (Cron) iniciados!');

  // 1. Aniversário de Doação
  // Executa todos os dias às 09:00 da manhã
  cron.schedule('0 9 * * *', async () => {
    try {
      await automationService.sendDonationAnniversaries();
    } catch (error) {
      console.error('[Cron Error] Falha no job de aniversário:', error);
    }
  }, {
    timezone: "America/Sao_Paulo"
  });

  // 2. Prestação de Contas (Exemplo)
  // Executa no dia 5 de cada mês às 10:00
  cron.schedule('0 10 5 * *', async () => {
      // await automationService.sendMonthlyReport();
      console.log('[Cron] Job mensal de relatório agendado (mas ainda não implementado).');
  }, {
    timezone: "America/Sao_Paulo"
  });

  // 3. Lembrete de PIX (Futuro)
  // cron.schedule('0 8 * * *', ...);
}