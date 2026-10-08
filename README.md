# Taxista Calc

Calculadora rápida de viagens para corretor de reboque/transporte de seguradora. PWA (Progressive Web App) que funciona **100% offline**, sem backend, sem frameworks, sem dependências externas. HTML + CSS + JavaScript puro.

## O que o app faz

- **Calcular**: informe os 3 trechos em km (base→origem, origem→destino, destino→base), o R$/km pago pela seguradora, o imposto % e a margem % — o app mostra em destaque o **Valor total da viagem** e o **Ideal** (valor que cobre o imposto e deixa sua margem de lucro), e logo abaixo o **Teto (sem pagar imposto)**, o **imposto a pagar** e o **lucro estimado**. O lucro estimado já vem calculado por padrão assumindo que você vai pagar o Ideal ao motorista — se preencher "oferta ao taxista" com outro valor, o lucro (e um aviso verde/amarelo/vermelho) recalcula com base nesse valor digitado.
- **Calculadora embutida**: ícone 🧮 no topo da tela Calcular, pra contas rápidas sem sair do app.
- **Histórico**: lista de viagens salvas, totais do mês, exportação em CSV (compatível com Excel em português) pra mandar pro contador.
- **Configurações**: imposto e margem padrão, R$/km padrão, lista de motoristas, backup/restauração dos dados em JSON.

## Como rodar no computador (teste rápido)

Service workers (o que faz o app funcionar offline) só funcionam em `http://localhost` ou `https://`, não em arquivo aberto direto (`file://`). Pra testar localmente, sirva a pasta com qualquer servidor estático. Com Python (já vem no Windows com o instalador oficial):

```bash
cd Taxista
python -m http.server 8099
```

Depois abra `http://localhost:8099` no navegador.

Se preferir Node.js:

```bash
npx serve .
```

## Como instalar no celular/tablet Android (uso real, offline)

O app **precisa estar hospedado em HTTPS** (ou rodando em localhost) para o Chrome permitir instalar. A forma mais simples e gratuita é o GitHub Pages:

### Hospedar grátis no GitHub Pages

1. Crie um repositório novo no GitHub (pode ser privado) e suba todos os arquivos desta pasta (`index.html`, `manifest.json`, `sw.js`, pastas `css/`, `js/`, `icons/`).
2. No repositório, vá em **Settings → Pages**.
3. Em "Source", escolha a branch `main` e a pasta `/ (root)`. Salve.
4. Em alguns minutos o GitHub mostra o endereço, algo como:
   `https://seu-usuario.github.io/nome-do-repositorio/`
5. Abra esse endereço no Chrome do celular/tablet.

### Alternativa: Netlify (arrastar e soltar, sem git)

1. Acesse [app.netlify.com/drop](https://app.netlify.com/drop).
2. Arraste a pasta inteira do projeto (ou um `.zip` dela) para a página.
3. O Netlify gera uma URL pública em segundos (ex: `https://taxista-calc-xyz.netlify.app`).
4. Abra essa URL no Chrome do celular.

### Instalar na tela inicial

1. Abra a URL publicada no **Chrome** do Android.
2. Toque no menu (⋮) no canto superior direito.
3. Toque em **"Adicionar à tela inicial"** (ou **"Instalar app"**, se aparecer automaticamente).
4. Confirme. O ícone do Taxista Calc aparece na tela inicial, abre em tela cheia (sem barra de endereço) e funciona **mesmo sem internet** depois do primeiro carregamento.

Repita o mesmo processo no tablet — é a mesma URL, funciona nos dois aparelhos independentemente, cada um guarda seus próprios dados salvos (localStorage é por aparelho/navegador, não sincroniza sozinho entre eles).

> **Importante**: depois de instalado, o app guarda todo o cache na primeira abertura. Se você alterar os arquivos no servidor depois (atualização do app), vai precisar também subir uma nova versão do `sw.js` com o número de `CACHE_NAME` incrementado (ex: `taxista-calc-v2`) para o celular baixar a atualização — isso já está preparado no código, só trocar o número.

## Backup dos dados

Na tela **Config → Backup**, use **"Exportar backup (JSON)"** de vez em quando (ex: toda semana) e guarde o arquivo em algum lugar seguro (e-mail para você mesmo, Google Drive, etc). Se trocar de celular ou limpar os dados do navegador sem querer, use **"Importar backup (JSON)"** para recuperar tudo.

## Testes

Abra `tests.html` (pelo mesmo servidor local, ex: `http://localhost:8099/tests.html`) para rodar os testes automáticos das funções de cálculo, incluindo o exemplo do enunciado (viagem de R$ 1.000, imposto 10%, margem 10% → teto R$ 900, ideal R$ 800, lucro R$ 100 se pagar o ideal ao motorista).

## Estrutura dos arquivos

```
index.html          - app principal (as 3 telas: Calcular / Histórico / Config)
tests.html           - página de testes das funções de cálculo
manifest.json         - metadados do PWA (ícone, nome, cor)
sw.js                 - service worker (cache offline)
css/app.css           - todo o estilo (tema claro/escuro automático)
js/calc.js            - funções puras de cálculo (sem tela, fácil de testar)
js/storage.js         - leitura/gravação no localStorage
js/app.js             - liga a interface às funções de cálculo e armazenamento
icons/                - ícones do PWA (192px e 512px, normais e "maskable")
```

`js/calc.js` foi propositalmente isolado da interface: os campos de km continuam sendo a única fonte de verdade, então no futuro dá para plugar a API do Google Maps Routes só para *preencher* esses campos automaticamente (origem/destino/base), sem mexer em nada do cálculo.

## Limitações conhecidas

- Sem internet, sem sincronização entre aparelhos: cada celular/tablet guarda seus próprios dados localmente.
- Se limpar os dados do navegador ("limpar cache e dados do site") pelo Android, as viagens salvas se perdem — por isso o backup é importante.
