import axios from 'axios';

// Em produção: https://www.asaas.com/api/v3
// Em sandbox: https://sandbox.asaas.com/api/v3
const ASAAS_API_URL = process.env.ASAAS_API_URL;
const ASAAS_API_KEY = process.env.ASAAS_API_KEY;

if (!ASAAS_API_URL || !ASAAS_API_KEY) {
    console.warn("Variáveis do Asaas não configuradas (ASAAS_API_URL ou ASAAS_API_KEY). O Plano B não funcionará.");
}

export const asaas = axios.create({
  baseURL: ASAAS_API_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json'
  }
});