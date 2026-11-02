# Xplore-menu

**SaaS Multi-Tenant de Cardápio Digital Interativo (Formato Rede Social) com Telemetria Comportamental Avançada**, acionado via tags NFC e QR Codes nas mesas de restaurantes, cafeterias e bares.

## Stack Tecnológica
- **Framework:** Next.js 14 (App Router, Turbopack, Server & Client Components)
- **Linguagem:** TypeScript 5 (`strict: true`, `noUncheckedIndexedAccess: true`)
- **UI & Design System:** TailwindCSS + Lucide React (Obsidian Dark Mode, foco em fotografia gastronômica e vídeos verticais 9:16)
- **Banco de Dados & Backend:** Supabase (PostgreSQL 15+, Row Level Security - RLS, Views Analíticas de Engenharia de Cardápio)
- **Persistência Offline / 4G Instável:** `LocalStorage` + `IndexedDB` fallback para manter a sacola de *"Meus Favoritos / Pedido Rápido"*, `session_id` anônimo e fila de lotes (`batching`) de telemetria comportamental.

## Rotas Principais
- `/` — Portal de Entrada e Simulador de Tags NFC / QR Code por mesa.
- `/nomade-bistro?source=nfc&location=mesa_04` — **Cardápio Digital Social (`/[tenantSlug]`)** com captura automática de origem NFC/QR, categorias em pills horizontais, feed vertical com snap scroll, vídeos em autoplay silencioso, carrossel de fotos, acordeão de alergênicos, gaveta de pedido rápido (Modo Mostrar ao Garçom + Checkout Pix Integrado) e HUD de Telemetria em Tempo Real.
- `/dashboard` — **Painel do Dono do Restaurante & Engenharia de Cardápio**:
  - **Matriz de Engenharia de Cardápio Automática:** Classifica os pratos em *Estrelas*, *Enigmas ("Quase Pediu")*, *Invisíveis (<1.5s)* e *Cavalos de Batalha*.
  - **Ranking de Retenção Visual:** Tempo Médio de Atenção (Dwell Time) vs. Taxa de Interação.
  - **Relatório "Quase Pediu e Desistiu":** Diagnóstico de pratos adicionados à seleção e removidos antes do pedido.
  - **Gestão de Cardápio (CRUD Completo):** Criação/edição de pratos, vídeos, preços, alergênicos e toggle instantâneo de *"Em Estoque / Esgotado Hoje"*.
  - **Gerador de Links NFC / QR Code:** Criação de pontos parametrizados com preview de display de mesa e payload NDEF (NTAG213/215).
- `/api/telemetry` — Endpoint de ingestão em lote de eventos comportamentais.
