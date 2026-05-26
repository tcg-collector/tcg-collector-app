# 💼 Modelo de Negócio — Freemium

#produto

## Estratégia

**Download gratuito.** Funcionalidades essenciais sempre grátis. Recursos avançados desbloqueados com assinatura.

## Planos

### 🆓 Plano Gratuito (sempre)
- Binder com até X cartas
- Preços em BRL (delay de 24h)
- 1 binder / coleção
- Busca e filtros básicos

### ⚡ Bindex Pro (pago)
- Binder ilimitado
- Preços em tempo real
- Binders múltiplos (por formato, por expansão, por graded)
- Avaliação de condição por IA (câmera)
- Alertas de preço na wishlist
- Histórico de preços com gráfico
- Export para CSV/PDF
- Sem anúncios

> ⚠️ Preços e limites do plano gratuito a definir com base em métricas de uso real.

## Canais de pagamento

| Canal | Solução | Quando |
|-------|---------|--------|
| Web | Stripe | Fase 2 |
| iOS App Store | Apple IAP | Fase 2 |
| Android Play Store | Google Play Billing | Fase 2 |
| Cross-platform | RevenueCat | Fase 2 — gerencia todas as assinaturas |

**Por que RevenueCat?**
- Painel unificado de assinaturas (iOS + Android + Web)
- Evita implementar 3 sistemas de pagamento separados
- Analytics de churn e LTV prontos
- SDK simples para React Native

## Métricas-chave (a monitorar)

- **Ativação**: % usuários que adicionam 10+ cartas no primeiro dia
- **Retenção D7/D30**: usuários que voltam após 7 e 30 dias
- **Conversão Free→Pro**: % que assina após usar gratuitamente
- **Churn mensal**: % que cancela a assinatura

---

*Veja também: [[Visão do Produto]] · [[../01 - Arquitetura/Stack Tecnológica]]*
