# ⚔️ ShadowBlade SMP — Web

![ShadowBlade SMP](https://img.shields.io/badge/Minecraft-Server-10b981?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=for-the-badge&logo=vercel)
![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)

Oficiální web Minecraft serveru **ShadowBlade SMP** — moderní český Survival server s aktivní komunitou.

📌 **IP:** `shadowbladesmp.org`  
💬 **Discord:** [dsc.gg/shadowbladesmp](https://dsc.gg/shadowbladesmp)

---

## 📋 Obsah

- [O projektu](#o-projektu)
- [Technologie](#technologie)
- [Struktura projektu](#struktura-projektu)
- [Spuštění lokálně](#spuštění-lokálně)
- [Deploy na Vercel](#deploy-na-vercel)
- [Vlastní doména](#vlastní-doména)
- [Správa obsahu](#správa-obsahu)
- [GitHub Workflow](#github-workflow)

---

## 🎯 O projektu

Statický web pro Minecraft server **ShadowBlade SMP** postavený s důrazem na:

- **Rychlost** — bleskové načítání díky statickým souborům
- **SEO** — optimalizované meta tagy a sitemap
- **Responzivitu** — perfektní vzhled na všech zařízeních
- **Jednoduchou správu** — veškerý obsah přes Markdown soubory na GitHubu

---

## 🛠️ Technologie

- **HTML5** — sémantická struktura
- **CSS3** — moderní styly s proměnnými, glassmorphism a animacemi
- **Vanilla JavaScript** — žádný framework, čistý a rychlý kód
- **Markdown** — veškerý obsah v `.md` souborech
- **Vercel** — automatický deploy z GitHubu

---

## 📁 Struktura projektu

```
shadowbladesmp-web/
├── index.html               # Domovská stránka
├── server.html               # O serveru
├── features.html             # Funkce
├── rules.html                # Pravidla (dynamická)
├── vote.html                 # Hlasování
├── wiki.html                 # Wiki (dynamická)
├── team.html                 # Tým (dynamický)
├── news.html                 # Novinky (dynamické)
├── faq.html                  # FAQ (dynamické)
├── 404.html                  # Chybová stránka
│
├── styles/
│   └── style.css             # Hlavní CSS (dark mode, emerald accents)
│
├── scripts/
│   ├── main.js               # Hlavní JS (navigace, animace, kopírování IP)
│   ├── server-status.js      # Minecraft server status API
│   └── content-loader.js     # Načítání Markdown/JSON obsahu
│
├── content/
│   ├── news/                 # Novinky (Markdown soubory)
│   ├── wiki/                 # Wiki články (Markdown)
│   ├── rules/                # Pravidla (Markdown)
│   ├── staff/                # Tým (Markdown)
│   └── faq.json              # FAQ (JSON)
│
├── assets/
│   └── images/               # Obrázky
│
├── vercel.json               # Vercel konfigurace
├── .gitignore
├── robots.txt
├── sitemap.xml
└── README.md
```

---

## 🚀 Spuštění lokálně

```bash
# 1. Naklonuj repozitář
git clone https://github.com/tvuj-ucet/shadowbladesmp-web.git

# 2. Přejdi do složky
cd shadowbladesmp-web

# 3. Otevři v prohlížeči (stačí poklepat na index.html)
# nebo použij live-server:
npx serve .
```

Žádný build step není potřeba — vše funguje rovnou.

---

## ▲ Deploy na Vercel

### Automatický deploy (doporučeno)

1. **Vytvoř repozitář** na [GitHub](https://github.com)
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tvuj-ucet/shadowbladesmp-web.git
git push -u origin main
```

2. **Přihlas se** na [Vercel](https://vercel.com) (přes GitHub účet)

3. **Importuj repozitář**
   - Klikni na **"Add New..." → "Project"**
   - Vyber svůj GitHub repozitář
   - Vercel automaticky rozpozná statický projekt
   - Klikni na **"Deploy"**

4. **Hotovo!** 🎉 Web je živý na `https://shadowbladesmp-web.vercel.app`

Každý push do `main` větve automaticky spustí nový deploy.

---

## 🌐 Vlastní doména

### Nastavení domény `shadowbladesmp.org`

1. **V projektu na Verceli:**
   - Jdi do **Settings → Domains**
   - Přidej `shadowbladesmp.org`
   - Vercel zobrazí DNS záznamy k přidání

2. **U registrátora domény:**
   - Přidej CNAME záznam:
     - Host: `@` nebo `shadowbladesmp.org`
     - Target: `cname.vercel-dns.com`
   - Nebo změň nameservery na Vercelovy

3. **Počkej na propagaci DNS** (pár minut až hodin)

---

## 📝 Správa obsahu

Všechny části webu se spravují přes GitHub — stačí upravit nebo přidat soubor.

### Novinky
```bash
# Přidání nové novinky
content/news/moje-novinka.md
```

Formát:
```markdown
---
nazev: Název novinky
datum: 2025-07-25
autor: Tvé jméno
kategorie: Aktualizace
---

Obsah novinky...

Kategorie: Aktualizace, Oznámení, Eventy, Soutěže, Vývoj serveru, Patch Notes
```

### Wiki
```bash
# Přidání wiki článku
content/wiki/muj-clanek.md
```

### Pravidla
```bash
# Úprava pravidel
content/rules/obecna.md
```

### Tým
```bash
# Přidání člena týmu
content/staff/jmeno.md
```

Formát:
```markdown
---
jmeno: Hráčovo jméno
role: Admin/Moderátor
popis: Krátký popis
discord: @discordtag
status: online
---
```

### FAQ
Uprav soubor `content/faq.json`:
```json
{
    "otazka": "Tvoje otázka?",
    "odpoved": "Tvoje odpověď."
}
```

---

## 🔄 GitHub Workflow

1. **Uprav content** → Commit a push do `main`
2. **Vercel detekuje změnu** → Automatický deploy
3. **Web je aktualizován** ✅

Žádný build, žádný backend, žádná databáze.

---

## 📄 Licence

MIT © ShadowBlade SMP

---

**⚔️ ShadowBlade SMP** — Kde začínají tvá dobrodružství.  
🌐 `shadowbladesmp.org` | 💬 [Discord](https://dsc.gg/shadowbladesmp)
