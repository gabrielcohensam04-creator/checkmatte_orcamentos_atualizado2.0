# Paleta de Cores — Checkmatte Orçamentos

Fonte: `src/tokens.js`

---

## Modo Claro (light)

| Token | Variável CSS                    | Hex       | Uso                              |
|-------|---------------------------------|-----------|----------------------------------|
| P     | `--primary`                     | `#a5360d` | Cor principal, botões, destaque  |
| PC    | `--primary-container`           | `#c74d24` | Container primário               |
| SEC   | `--secondary`                   | `#8b4e3b` | Labels, ícones secundários       |
| BG    | —                               | `#fff8f6` | Fundo da página                  |
| SURF  | `--surface`                     | `#fff8f6` | Fundo de superfícies             |
| SCLO  | `--surface-container-lowest`    | `#ffffff` | Fundo de cards                   |
| SCLN  | `--surface-container-low`       | `#fff1ed` | Hover de cards                   |
| SCN   | `--surface-container`           | `#ffe9e3` | Stepper, chips, ícone boxes      |
| SCHN  | `--surface-container-high`      | `#fbe3dd` | Card selecionado, expand panel   |
| SCHG  | `--surface-container-highest`   | `#f5ded7` | —                                |
| ONS   | `--on-surface`                  | `#251915` | Texto principal                  |
| ONSV  | `--on-surface-variant`          | `#58423b` | Texto secundário                 |
| OL    | `--outline`                     | `#8c7169` | Ícones inativos                  |
| OV    | `--outline-variant`             | `#e0c0b6` | Bordas, divisores                |
| TERT  | `--tertiary`                    | `#006482` | Status "Concluído"               |
| ERR   | `--error`                       | `#ba1a1a` | Erros, reprovado                 |
| SUC   | `--success`                     | `#16a34a` | Sucesso, aprovado                |
| WARN  | `--warning`                     | `#c75000` | Pendente, avisos                 |

---

## Modo Escuro (dark)

| Token | Variável CSS                    | Hex       | Uso                              |
|-------|---------------------------------|-----------|----------------------------------|
| P     | `--primary`                     | `#ff8a65` | Cor principal, botões, destaque  |
| PC    | `--primary-container`           | `#ffb4a0` | Container primário               |
| SEC   | `--secondary`                   | `#757575` | Labels, ícones secundários       |
| BG    | —                               | `#000000` | Fundo da página (preto puro)     |
| SURF  | `--surface`                     | `#0f0f0f` | Fundo de superfícies             |
| SCLO  | `--surface-container-lowest`    | `#1a1a1a` | Fundo de cards                   |
| SCLN  | `--surface-container-low`       | `#121212` | Hover de cards                   |
| SCN   | `--surface-container`           | `#242424` | Stepper, chips, ícone boxes      |
| SCHN  | `--surface-container-high`      | `#2e2e2e` | Card selecionado, expand panel   |
| SCHG  | `--surface-container-highest`   | `#383838` | —                                |
| ONS   | `--on-surface`                  | `#e0e0e0` | Texto principal                  |
| ONSV  | `--on-surface-variant`          | `#9e9e9e` | Texto secundário                 |
| OL    | `--outline`                     | `#616161` | Ícones inativos                  |
| OV    | `--outline-variant`             | `#333333` | Bordas, divisores                |
| TERT  | `--tertiary`                    | `#64b5f6` | Status "Concluído"               |
| ERR   | `--error`                       | `#ef9a9a` | Erros, reprovado                 |
| SUC   | `--success`                     | `#81c784` | Sucesso, aprovado                |
| WARN  | `--warning`                     | `#ffb74d` | Pendente, avisos                 |

---

## Status de Orçamento

| Status      | Label      | Cor (light)            | Cor (dark)             |
|-------------|------------|------------------------|------------------------|
| `pending`   | Pendente   | `#c75000` (WARN)       | `#ffb74d` (WARN)       |
| `approved`  | Aprovado   | `#16a34a` (SUC)        | `#81c784` (SUC)        |
| `rejected`  | Reprovado  | `#ba1a1a` (ERR)        | `#ef9a9a` (ERR)        |
| `completed` | Concluído  | `#006482` (TERT)       | `#64b5f6` (TERT)       |

---

## Como usar

**Em JSX (via tokens JS):**
```js
import { light, dark } from './src/tokens';
const { P, ONS, SCLO } = isDark ? dark : light;
```

**Em CSS (via custom properties):**
```css
color: var(--primary);
background: var(--surface-container-lowest);
border: 0.5px solid var(--outline-variant);
```
