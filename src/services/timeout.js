// El backend es serverless: la primera petición tras un rato sin uso paga el
// arranque en frío (función + Neon despertando), que puede pasar de 10 s.
// Compartido por apiClient y grupoClient para que no se desalineen.
export const API_TIMEOUT_MS = 30000;
