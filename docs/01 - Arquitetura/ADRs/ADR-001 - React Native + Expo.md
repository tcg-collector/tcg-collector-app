# ADR-001 — React Native + Expo como framework mobile

#arquitetura #decisão

**Status**: ✅ Aprovada  
**Data**: maio 2026

## Contexto
Precisamos de um app que rode no iPhone e Android com uma equipe pequena (solo). Não temos Mac para desenvolvimento iOS nativo e não queremos manter duas codebases separadas.

## Decisão
Usar **React Native com Expo SDK 52** como único framework mobile, com suporte a Web como bônus.

## Consequências

### Positivas
- Um único código roda no Android, iOS e Web
- Expo Go permite testar no iPhone **sem nenhum build** (só escanear QR Code)
- EAS Build gera APK/IPA na nuvem — **não precisa de Mac nem Android Studio**
- Comunidade enorme, documentação excelente
- JavaScript/TypeScript em tudo — só uma linguagem para aprender

### Negativas / trade-offs
- Performance inferior a apps 100% nativos para casos extremos
- Algumas APIs nativas precisam de Expo modules ou bare workflow
- Bundle maior que apps nativos

## Alternativas consideradas

| Opção | Por que foi descartada |
|-------|----------------------|
| Flutter | Dart como linguagem extra, menos ecosistema JS |
| Swift (iOS nativo) | Requer Mac, não roda no Android |
| Kotlin (Android nativo) | Não roda no iOS, requer Android Studio |
| PWA (Web only) | Sem acesso à câmera nativa, não publica nas lojas |

---
*Veja também: [[ADR-003 - Expo EAS sem nativo local]]*
