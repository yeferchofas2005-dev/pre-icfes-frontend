const fs = require('fs');
const path = require('path');

// Intentar cargar variables desde .env si existe localmente
const envPath = path.resolve(__dirname, '../.env');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

// Tomar de process.env (Vercel) o del archivo .env local, o usar valores vacíos
const getEnv = (key) => {
  return process.env[key] || envVars[key] || '';
};

const requiredKeys = [
  'NG_APP_GOOGLE_API_KEY',
  'NG_APP_GOOGLE_SPREADSHEET_ID',
  'NG_APP_EMAILJS_PUBLIC_KEY',
  'NG_APP_EMAILJS_SERVICE_ID',
  'NG_APP_EMAILJS_TEMPLATE_ID',
  'NG_APP_CHATBOT_URL'
];

const missingKeys = requiredKeys.filter((key) => !getEnv(key));
if (missingKeys.length > 0) {
  console.warn(`⚠️ Variables de entorno faltantes: ${missingKeys.join(', ')}. Define estas variables en Vercel o en .env para que la app funcione correctamente.`);
}

const environmentFileContent = `// Archivo generado automáticamente por scripts/set-env.js - NO MODIFICAR DIRECTAMENTE
export const environment = {
  production: true,
  googleApiKey: '${getEnv('NG_APP_GOOGLE_API_KEY')}',
  googleSpreadsheetId: '${getEnv('NG_APP_GOOGLE_SPREADSHEET_ID')}',
  emailjsPublicKey: '${getEnv('NG_APP_EMAILJS_PUBLIC_KEY')}',
  emailjsServiceId: '${getEnv('NG_APP_EMAILJS_SERVICE_ID')}',
  emailjsTemplateId: '${getEnv('NG_APP_EMAILJS_TEMPLATE_ID')}',
  chatbotUrl: '${getEnv('NG_APP_CHATBOT_URL')}'
};
`;

const devEnvironmentFileContent = `// Archivo generado automáticamente por scripts/set-env.js - NO MODIFICAR DIRECTAMENTE
export const environment = {
  production: false,
  googleApiKey: '${getEnv('NG_APP_GOOGLE_API_KEY')}',
  googleSpreadsheetId: '${getEnv('NG_APP_GOOGLE_SPREADSHEET_ID')}',
  emailjsPublicKey: '${getEnv('NG_APP_EMAILJS_PUBLIC_KEY')}',
  emailjsServiceId: '${getEnv('NG_APP_EMAILJS_SERVICE_ID')}',
  emailjsTemplateId: '${getEnv('NG_APP_EMAILJS_TEMPLATE_ID')}',
  chatbotUrl: '${getEnv('NG_APP_CHATBOT_URL')}'
};
`;

const targetDir = path.resolve(__dirname, '../src/environments');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

fs.writeFileSync(path.join(targetDir, 'environment.ts'), environmentFileContent);
fs.writeFileSync(path.join(targetDir, 'environment.development.ts'), devEnvironmentFileContent);

console.log('✅ Entornos Angular generados exitosamente en src/environments/');
