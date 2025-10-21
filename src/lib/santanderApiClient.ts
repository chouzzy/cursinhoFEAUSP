import axios from 'axios';
import https from 'https';
import fs from 'fs';

// --- CONFIGURAÇÃO ---
// Garanta que estas variáveis de ambiente estejam no seu arquivo .env
const SANTANDER_CLIENT_ID = process.env.SANTANDER_CLIENT_ID_PROD;
const SANTANDER_CLIENT_SECRET = process.env.SANTANDER_CLIENT_SECRET_PROD;
const CERT_PATH = process.env.SANTANDER_CERT_PATH; // Ex: /etc/ssl/santander/certificado.pem
const KEY_PATH = process.env.SANTANDER_KEY_PATH;   // Ex: /etc/ssl/santander/chave_privada.pem

// Validação para garantir que as variáveis foram carregadas
if (!SANTANDER_CLIENT_ID || !SANTANDER_CLIENT_SECRET || !CERT_PATH || !KEY_PATH) {
  throw new Error("As variáveis de ambiente do Santander não foram configuradas corretamente.");
}

// Codifica as credenciais para o header de autenticação Basic
const authString = Buffer.from(`${SANTANDER_CLIENT_ID}:${SANTANDER_CLIENT_SECRET}`).toString('base64');

// Agente HTTPS que "injeta" seus certificados de segurança (mTLS) em cada requisição
const httpsAgent = new https.Agent({
  cert: fs.readFileSync(CERT_PATH),
  key: fs.readFileSync(KEY_PATH),
  // passphrase: 'sua-senha-da-chave-privada' // Descomente se sua chave privada tiver senha
});

// Instância do Axios pré-configurada para a API do Santander
const apiClient = axios.create({
  baseURL: 'https://trust-pix.santander.com.br/',
  httpsAgent,
});

// --- GERENCIAMENTO DE TOKEN ---
// Variáveis para guardar o token em memória e evitar chamadas desnecessárias
let accessToken: string | null = null;
let tokenExpiresAt: number | null = null;

async function getAccessToken(): Promise<string> {
  // Se já temos um token e ele ainda é válido (com margem de segurança), o reutilizamos
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    console.log('Reutilizando access_token do Santander.');
    return accessToken;
  }

  console.log('Gerando novo access_token para o Santander...');
  const response = await axios.post(
    'https://trust-pix.santander.com.br/oauth/token',
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authString}`,
      },
      httpsAgent, // O endpoint de token também exige o certificado
    }
  );

  console.log('Resposta do token:', response.data);

  const { access_token, expires_in } = response.data;
  accessToken = access_token;
  // Armazena o timestamp de quando o token irá expirar, com 5 minutos de segurança
  tokenExpiresAt = Date.now() + (expires_in - 300) * 1000;
  console.log('Novo access_token gerado com sucesso.');
  
  if (!accessToken) {
    throw new Error("Falha ao obter access_token do Santander.");
  }
  return accessToken;
}

// --- FUNÇÕES DA API ---

/**
 * Cria uma cobrança PIX imediata no Santander.
 * @param txid - O ID de transação único (26-35 caracteres) que você gera.
 * @param data - O corpo da requisição com os dados da cobrança.
 */
async function createCob(txid: string, data: any) {
  const token = await getAccessToken();
  
  // No seu YML, a URL de sandbox era diferente. Vamos usar a de produção aqui.
  // Se precisar testar, pode mudar a URL base ou o path.
  const response = await apiClient.put(`/cob/${txid}`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.data;
}

// Exportamos um objeto com as funções que o resto do sistema pode usar
export const santanderApiClient = {
  createCob,
};

// ### **O que este código faz:**

// 1.  **Lê as Credenciais:** Ele busca suas chaves e os caminhos para os certificados a partir das variáveis de ambiente (`.env`).
// 2.  **Prepara a Segurança:** Cria um "agente" `https` que anexa seus certificados em todas as chamadas, cumprindo a exigência de segurança (mTLS) do Santander.
// 3.  **Gerencia o Token:** A função `getAccessToken` é inteligente. Ela pega um novo token e o guarda em memória. Se você chamar de novo dentro do prazo de validade, ela reutiliza o mesmo token, economizando tempo e requisições.
// 4.  **Cria a Cobrança:** A função `createCob` é a que vamos usar para efetivamente gerar o PIX. Ela primeiro garante que tem um token válido e depois faz a chamada `PUT` para o Santander.

// ### **Seus Próximos Passos:**

// 1.  **Crie o arquivo** `src/lib/santanderApiClient.ts` e cole este código.
// 2.  **Adicione as variáveis ao seu arquivo `.env`** no servidor com os valores de **produção** que seu cliente passou. Você precisará subir os arquivos `.pem` (certificado e chave) para um local seguro no servidor e colocar o caminho deles nas variáveis.

//    # .env
//    SANTANDER_CLIENT_ID_PROD="seu-client-id-de-producao"
//    SANTANDER_CLIENT_SECRET_PROD="seu-client-secret-de-producao"
//    SANTANDER_CERT_PATH="/caminho/no/servidor/para/certificado_publico.pem"
//    SANTANDER_KEY_PATH="/caminho/no/servidor/para/chave_privada.pem"
//    SANTANDER_PIX_KEY="sua-chave-pix-de-producao"
   

