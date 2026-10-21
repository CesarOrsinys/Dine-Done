import { app } from './app.js';
import { config } from './config.js';

app.listen(config.port, () => {
  console.log(`🚀 [BFF Backend] Servidor intermediario Dine & Done activo en http://localhost:${config.port}`);
  console.log(`🔒 Credenciales de Supabase protegidas del lado del servidor.`);
});
