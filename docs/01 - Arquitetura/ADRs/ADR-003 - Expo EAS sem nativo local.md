# ADR-003 — Usar EAS Build em vez de ambiente nativo local

#arquitetura #decisão

**Status**: ✅ Aprovada  
**Data**: maio 2026

## Contexto
Publicar na App Store normalmente exige Mac com Xcode. Publicar na Play Store exige Android Studio. Instalar e manter esses ambientes é custoso em tempo e máquina.

## Decisão
Usar **Expo EAS Build** para gerar os binários (IPA/APK) na nuvem, sem instalar Xcode nem Android Studio localmente.

Fluxo:
1. `eas build --platform ios` → Expo compila na nuvem
2. Download do `.ipa` → submit direto para App Store Connect
3. Mesmo para Android com `.aab`

## Consequências

### Positivas
- Não precisa de Mac para publicar no iOS
- Não precisa de Android Studio
- EAS Free: 30 builds/mês (suficiente para MVP)
- `eas submit` automatiza o envio para as lojas

### Negativas / trade-offs
- Builds podem demorar 10–20 minutos na fila gratuita
- Sem debug nativo local (mas Expo Go cobre 99% dos casos de dev)
- Dependência de serviço externo da Expo

## Alternativas consideradas

| Opção | Por que foi descartada |
|-------|----------------------|
| Xcode local | Requer Mac ($1000+) |
| Android Studio local | Pesado, ocupa 10+ GB, complexo de configurar |
| Bare workflow manual | Perde benefícios do Expo managed |

---
*Veja também: [[ADR-001 - React Native + Expo]]*
