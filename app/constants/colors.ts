/**
 * Bindex TCG — Paleta de cores oficial
 * Baseada no Brand Guide v1.0
 */

export const Colors = {
  // Fundos (dark-first)
  void:     '#0c0c10',   // background principal
  surface:  '#13131a',   // cards, modais
  surface2: '#1a1a24',   // inputs, itens de lista

  // Texto
  snow:  '#f5f5f7',   // texto principal
  ash:   '#8b8b9b',   // texto secundário / placeholder

  // Acento principal
  gold:   '#e8b84b',   // único acento vibrante — CTAs, destaques

  // Feedback / status
  mint:    '#4ade80',   // sucesso, preço subindo
  sky:     '#60a5fa',   // info, link
  ember:   '#fb923c',   // aviso
  crimson: '#f87171',   // erro, preço caindo

  // Bordas
  border:  '#2a2a38',
} as const;

export type ColorKey = keyof typeof Colors;
