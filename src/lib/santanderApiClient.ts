import axios from 'axios';
import https from 'https';
import fs from 'fs';

// --- CONFIGURAÇÃO ---
const SANTANDER_CLIENT_ID = process.env.SANTANDER_CLIENT_ID_PROD;
const SANTANDER_CLIENT_SECRET = process.env.SANTANDER_CLIENT_SECRET_PROD;
const CERT_PATH = process.env.SANTANDER_CERT_PATH;
const KEY_PATH = process.env.SANTANDER_KEY_PATH;

if (!SANTANDER_CLIENT_ID || !SANTANDER_CLIENT_SECRET || !CERT_PATH || !KEY_PATH) {
  throw new Error("As variáveis de ambiente do Santander não foram configuradas corretamente.");
}

const authString = Buffer.from(`${SANTANDER_CLIENT_ID}:${SANTANDER_CLIENT_SECRET}`).toString('base64');

const httpsAgent = new https.Agent({
  cert: fs.readFileSync(CERT_PATH),
  key: fs.readFileSync(KEY_PATH),
});

const apiClient = axios.create({
  baseURL: 'https://trust-pix.santander.com.br',
  httpsAgent,
});

let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

async function getAccessToken(): Promise<string> {
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    console.log('Reutilizando access_token do Santander.');
    return accessToken;
  }

  console.log('Gerando novo access_token para o Santander...');
  
  // **CORREÇÃO DEFINITIVA:**
  // Conforme a documentação, os parâmetros `grant_type` e `scope` são enviados na URL (query string),
  // e não no corpo da requisição.
  const scopes = 'cob.write cob.read pix.write pix.read webhook.write webhook.read';
  const urlWithParams = `/oauth/token?grant_type=client_credentials&scope=${encodeURIComponent(scopes)}`;

  try {
    const response = await axios.post(
      urlWithParams,
      null, // O corpo da requisição agora é vazio (null)
      {
        baseURL: 'https://trust-pix.santander.com.br', // Assegurando a base da URL correta para esta chamada
        headers: {
          'Authorization': `Basic ${authString}`,
        },
        httpsAgent,
      }
    );

    const { access_token, expires_in } = response.data;
    accessToken = access_token;
    tokenExpiresAt = Date.now() + (expires_in - 300) * 1000;
    console.log('Novo access_token gerado com sucesso.');
    
    if (!accessToken) {
      throw new Error('access_token não recebido do Santander.');
    } 
    return accessToken;
  } catch (error: any) {
    console.error('Erro ao obter access_token do Santander:', error.response?.data || error.message);
    throw new Error('Falha ao obter access_token do Santander.');
  }
}

async function createCob(txid: string, data: any) {
  const token = await getAccessToken();
  
  const response = await apiClient.put(`/cob/${txid}`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.data;
}

export const santanderApiClient = {
  createCob,
};

