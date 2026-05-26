# ⚙️ Stack Tecnológica

#arquitetura

## Versões instaladas (maio 2026)

| Ferramenta | Versão | Notas |
|-----------|--------|-------|
| Node.js | v24.16.0 | Instalado via official installer |
| npm | 11.13.0 | Incluído com Node |
| Git | 2.54.0 | Git for Windows |
| TypeScript | 5.4.5 | Backend / 5.3.3 App |
| Expo SDK | 52 | React Native 0.76.6 |

## Frontend

```
React Native + Expo SDK 52
├── expo-router ~4.0        ← Roteamento file-based
├── @expo/vector-icons      ← Ionicons
├── expo-splash-screen      ← Tela de splash
├── expo-font               ← Fontes customizadas
└── react-native-screens    ← Navegação nativa
```

**Por que Expo?**
- Android + iOS + Web com um único código
- EAS Build faz o build nas lojas **sem precisar de Mac ou Android Studio**
- Expo Go permite testar no iPhone instantaneamente (scan QR)

## Backend

```
Node.js + Express + TypeScript
├── express ^4.19.2        ← Framework HTTP
├── mongoose ^8.4.1        ← ODM MongoDB
├── dotenv ^16.4.5         ← Variáveis de ambiente
├── cors ^2.8.5            ← CORS
├── axios ^1.7.2           ← Chamadas HTTP externas
├── node-cron ^3.0.3       ← Sync periódico de preços
├── nodemon ^3.1.3         ← Hot reload (dev)
└── ts-node ^10.9.2        ← TypeScript direto no Node
```

## Banco de dados

```
MongoDB Atlas M0 (gratuito)
├── Região: sa-east-1 (São Paulo)
├── Cluster: cluster0.2qatmls.mongodb.net
└── Database: bindex-tcg
```

**Por que MongoDB?**
- Dados de cartas são semi-estruturados (nem toda carta tem todos os campos)
- Time Series Collections nativas para histórico de preços
- Atlas M0 é gratuito para sempre (512 MB)

## Hospedagem planejada (produção)

| Serviço | O que hospeda | Custo |
|---------|--------------|-------|
| Railway ou Render | Backend Node.js | Gratuito (hobby) |
| Vercel | Frontend Web | Gratuito |
| MongoDB Atlas M0 | Banco de dados | Gratuito |
| Expo EAS | Builds mobile | Gratuito (limite mensal) |
| Cloudinary | Imagens otimizadas | Gratuito |

## Autenticação (a definir — Fase 1)

Candidatos:
- **Clerk** — fácil integração, gratuito até 10k MAU
- **Supabase Auth** — open source, gratuito

## Pagamentos (Fase 2+)

| Canal | Solução |
|-------|---------|
| Web | Stripe |
| iOS | Apple In-App Purchase |
| Android | Google Play Billing |
| Cross-platform | RevenueCat (gerencia assinaturas em todas as plataformas) |

---

*Veja também: [[Visão Geral do Sistema]] · [[ADRs/ADR-000 - Índice]]*
