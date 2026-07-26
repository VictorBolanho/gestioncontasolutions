export function getAuthenticationErrorResponse(error) {
  const statusCode = Number(error?.statusCode || 400);
  if (statusCode === 429) {
    const retryAfterSeconds = Math.max(1, Math.min(86400, Number(error?.retryAfterSeconds || 1)));
    return {
      statusCode: 429,
      payload: { error: "Demasiados intentos de inicio de sesion. Intenta mas tarde." },
      headers: { "Retry-After": String(Math.ceil(retryAfterSeconds)) }
    };
  }
  if (statusCode === 401) {
    return {
      statusCode: 401,
      payload: { error: "Credenciales invalidas." }
    };
  }
  return {
    statusCode: 400,
    payload: { error: "No fue posible iniciar sesion." }
  };
}
