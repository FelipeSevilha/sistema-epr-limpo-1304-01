export type ClienteScore = {
  score: number;
  nivel: 'SAUDAVEL' | 'ATENCAO' | 'RISCO';
  limiteSugerido: number;
};

export function calcularScore({
  faturamento,
  pedidos,
  emAberto,
}: {
  faturamento: number;
  pedidos: number;
  emAberto: number;
}): ClienteScore {
  let score = 50;

  if (faturamento > 20000) score += 20;
  else if (faturamento > 5000) score += 10;

  if (pedidos > 10) score += 10;
  else if (pedidos > 3) score += 5;

  if (emAberto > 0) score -= 20;
  if (emAberto > faturamento * 0.3) score -= 30;

  score = Math.max(0, Math.min(100, score));

  let nivel: ClienteScore['nivel'] = 'SAUDAVEL';
  if (score < 40) nivel = 'RISCO';
  else if (score < 70) nivel = 'ATENCAO';

  const limiteSugerido = Math.max(500, faturamento * 0.3);

  return { score, nivel, limiteSugerido };
}
