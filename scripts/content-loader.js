/* ============================================
   ShadowBlade SMP - Content Loader
   Načítání obsahu z Markdown souborů
   ============================================ */

'use strict';

// --- Simple Markdown Parser ---
class SimpleMarkdown {
    static parse(text) {
        if (!text) return '';

        let html = text;

        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Bold and Italic
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Code blocks
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');

        // Inline code
        html = html.replace(/`(.+?)`/g, '<code>$1</code>');

        // Links
        html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Images
        html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" loading="lazy">');

        // Lists (unordered)
        html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

        // Lists (ordered)
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');

        // Blockquotes
        html = html.replace(/^> (.+)$/gm, '<blockquote><p>$1</p></blockquote>');

        // Paragraphs - wrap remaining lines in <p> tags
        const lines = html.split('\n');
        let result = [];
        let inBlock = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (!line) {
                if (!inBlock) result.push('');
                continue;
            }

            // Skip HTML tags that are already rendered
            if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('</ul') || 
                line.startsWith('<li') || line.startsWith('<pre') || line.startsWith('</pre') ||
                line.startsWith('<blockquote') || line.startsWith('</blockquote') ||
                line.startsWith('<hr') || line.startsWith('<img') || line.startsWith('</ol') ||
                line.startsWith('<ol')) {
                result.push(line);
                continue;
            }

            // Wrap in paragraph if it's plain text
            if (!line.startsWith('<')) {
                result.push(`<p>${line}</p>`);
            } else {
                result.push(line);
            }
        }

        // Fix nested list issues
        html = result.join('\n');
        html = html.replace(/<\/ul>\n<ul>/g, '');
        html = html.replace(/<\/ol>\n<ol>/g, '');

        return html;
    }

    // Parse frontmatter from markdown
    static parseFrontmatter(text) {
        const meta = {};
        const match = text.match(/^---\n([\s\S]*?)\n---\n/);
        
        if (match) {
            const frontmatter = match[1];
            frontmatter.split('\n').forEach(line => {
                const [key, ...values] = line.split(':');
                if (key && values.length) {
                    meta[key.trim()] = values.join(':').trim();
                }
            });
        }

        return meta;
    }

    // Remove frontmatter from markdown
    static removeFrontmatter(text) {
        return text.replace(/^---\n[\s\S]*?\n---\n/, '');
    }
}

// --- Content Loader ---
class ContentLoader {
    constructor() {
        this.cache = new Map();
        this.basePath = 'content';
    }

    async loadFile(path) {
        if (this.cache.has(path)) {
            return this.cache.get(path);
        }

        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            this.cache.set(path, text);
            return text;
        } catch (error) {
            console.warn(`Failed to load ${path}:`, error);
            return null;
        }
    }

    async loadMarkdown(path) {
        const text = await this.loadFile(path);
        if (!text) return null;

        return {
            meta: SimpleMarkdown.parseFrontmatter(text),
            content: SimpleMarkdown.removeFrontmatter(text),
            html: SimpleMarkdown.parse(SimpleMarkdown.removeFrontmatter(text))
        };
    }

    async loadJSON(path) {
        const text = await this.loadFile(path);
        if (!text) return null;

        try {
            return JSON.parse(text);
        } catch {
            console.warn(`Invalid JSON: ${path}`);
            return null;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

const contentLoader = new ContentLoader();

// --- News Functions ---
async function loadNews() {
    const newsContainer = document.getElementById('news-container');
    if (!newsContainer) return;

    // Load news index for auto-discovery of new files
    const index = await contentLoader.loadJSON('content/news/index.json');
    const newsFiles = index || [];

    const allNews = [];

    for (const file of newsFiles) {
        const data = await contentLoader.loadMarkdown(file);
        if (data && data.meta) {
            allNews.push({
                ...data,
                slug: file.replace('content/news/', '').replace('.md', ''),
                file: file
            });
        }
    }

    // Sort by date (newest first)
    allNews.sort((a, b) => new Date(b.meta.datum) - new Date(a.meta.datum));

    return allNews;
}

async function renderNews(filter = 'all', search = '') {
    const container = document.getElementById('news-container');
    if (!container) return;

    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Načítám novinky...</span></div>';

    const allNews = await loadNews();
    
    if (!allNews || allNews.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📰</div>
                <h3>Žádné novinky</h3>
                <p>Zatím zde nejsou žádné novinky. Brzy přibudou!</p>
            </div>
        `;
        return;
    }

    let filtered = allNews;

    if (filter !== 'all') {
        filtered = filtered.filter(n => n.meta.kategorie === filter);
    }

    if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(n => 
            n.meta.nazev?.toLowerCase().includes(s) ||
            n.meta.autor?.toLowerCase().includes(s) ||
            n.html?.toLowerCase().includes(s)
        );
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Nic nenalezeno</h3>
                <p>Zkuste změnit filtr nebo hledaný výraz.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(news => {
        const emoji = getCategoryEmoji(news.meta.kategorie);
        return `
            <article class="news-card fade-in" onclick="showNewsDetail('${news.slug}')">
                <div class="news-card-image">${emoji}</div>
                <div class="news-card-body">
                    <div class="news-card-meta">
                        <span class="news-card-category">${news.meta.kategorie || 'Novinka'}</span>
                        <span>${formatDate(news.meta.datum)}</span>
                        <span>${news.meta.autor || 'ShadowBlade Team'}</span>
                    </div>
                    <h3>${news.meta.nazev || 'Bez názvu'}</h3>
                    <p>${stripHtml(news.html).substring(0, 150)}...</p>
                </div>
            </article>
        `;
    }).join('');

    // Re-trigger scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });

    container.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

async function showNewsDetail(slug) {
    const data = await contentLoader.loadMarkdown(`content/news/${slug}.md`);
    if (!data) {
        window.showToast('❌ Novinka nenalezena', 'error');
        return;
    }

    // Remove existing detail if any
    const existing = document.getElementById('news-detail');
    if (existing) existing.remove();

    // Find the main content section to append detail
    const contentSection = document.querySelector('.content-section .container');
    if (!contentSection) return;

    const detail = document.createElement('div');
    detail.id = 'news-detail';
    detail.className = 'news-detail';
    detail.innerHTML = `
        <div class="news-detail-header">
            <h1>${escapeHtml(data.meta.nazev || 'Bez názvu')}</h1>
            <div class="news-detail-meta">
                <span>📅 ${formatDate(data.meta.datum)}</span>
                <span>✍️ ${escapeHtml(data.meta.autor || 'ShadowBlade Team')}</span>
                <span>🏷️ ${escapeHtml(data.meta.kategorie || 'Novinka')}</span>
            </div>
        </div>
        <div class="news-detail-content">
            ${data.html}
        </div>
        <div style="text-align:center;margin-top:2rem;">
            <button class="btn btn-secondary" onclick="closeNewsDetail()">
                ← Zpět na novinky
            </button>
        </div>
    `;

    const newsContainer = document.getElementById('news-container');
    const filterBar = document.querySelector('.filter-bar');
    
    if (newsContainer) newsContainer.style.display = 'none';
    if (filterBar) filterBar.style.display = 'none';
    
    contentSection.appendChild(detail);
    detail.scrollIntoView({ behavior: 'smooth' });
}

function closeNewsDetail() {
    const detail = document.getElementById('news-detail');
    if (detail) detail.remove();
    
    const newsContainer = document.getElementById('news-container');
    const filterBar = document.querySelector('.filter-bar');
    
    if (newsContainer) newsContainer.style.display = '';
    if (filterBar) filterBar.style.display = '';
}

// Make news functions globally accessible
window.renderNews = renderNews;
window.showNewsDetail = showNewsDetail;
window.closeNewsDetail = closeNewsDetail;

// --- Wiki Functions ---
async function loadWikiArticles() {
    const wikiFiles = [
        'content/wiki/zaciname.md',
        'content/wiki/pripojeni.md',
        'content/wiki/prikazy.md',
        'content/wiki/ekonomika.md',
        'content/wiki/ranky.md',
        'content/wiki/crates.md',
        'content/wiki/eventy.md',
        'content/wiki/itemy.md'
    ];

    const articles = [];

    for (const file of wikiFiles) {
        const data = await contentLoader.loadMarkdown(file);
        if (data && data.meta) {
            articles.push({
                ...data,
                slug: file.replace('content/wiki/', '').replace('.md', ''),
                file: file
            });
        }
    }

    return articles;
}

async function renderWiki() {
    const container = document.getElementById('wiki-content');
    if (!container) return;

    const articles = await loadWikiArticles();
    const categories = [...new Set(articles.map(a => a.meta.kategorie).filter(Boolean))];

    // Render sidebar
    const sidebar = document.getElementById('wiki-sidebar');
    if (sidebar) {
        sidebar.innerHTML = `
            <h4>Kategorie</h4>
            <ul class="wiki-nav">
                ${categories.map(cat => `
                    <li><a href="#" onclick="filterWiki('${cat}'); return false">${cat}</a></li>
                `).join('')}
            </ul>
        `;
    }

    // Render content
    renderWikiArticles(articles);
}

function renderWikiArticles(articles) {
    const container = document.getElementById('wiki-content');
    if (!container) return;

    if (!articles || articles.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>Žádné články</h3>
                <p>Wiki články budou brzy přidány.</p>
            </div>
        `;
        return;
    }

    const categories = [...new Set(articles.map(a => a.meta.kategorie).filter(Boolean))];

    container.innerHTML = articles.map(article => `
        <div class="content-card wiki-article fade-in">
            <h2>${article.meta.nazev || 'Bez názvu'}</h2>
            <span class="news-card-category">${article.meta.kategorie || 'Obecné'}</span>
            ${article.html}
        </div>
    `).join('');

    // Trigger scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    container.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

async function filterWiki(category) {
    const allArticles = await loadWikiArticles();
    const filtered = category === 'all' ? allArticles : allArticles.filter(a => a.meta.kategorie === category);
    renderWikiArticles(filtered);
}

window.filterWiki = filterWiki;
window.renderWiki = renderWiki;

// --- Rules Functions ---
async function loadRules() {
    const files = [
        'content/rules/obecna.md',
        'content/rules/chat.md',
        'content/rules/pvp.md',
        'content/rules/staveni.md',
        'content/rules/ekonomika.md',
        'content/rules/cheaty.md',
        'content/rules/tresty.md'
    ];

    const rules = [];

    for (const file of files) {
        const data = await contentLoader.loadMarkdown(file);
        if (data && data.meta) {
            rules.push({
                ...data,
                slug: file.replace('content/rules/', '').replace('.md', ''),
                file: file
            });
        }
    }

    return rules;
}

async function renderRules() {
    const container = document.getElementById('rules-container');
    if (!container) return;

    const rules = await loadRules();

    if (!rules || rules.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📜</div>
                <h3>Žádná pravidla</h3>
                <p>Pravidla budou brzy přidána.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = rules.map(rule => `
        <div class="rules-category fade-in">
            <h3>${getCategoryIcon(rule.meta.kategorie)} ${rule.meta.nazev || 'Pravidla'}</h3>
            <div class="content-card">
                <ul class="rules-list">
                    ${parseRulesList(rule.html)}
                </ul>
            </div>
        </div>
    `).join('');

    // Trigger animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    container.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

function parseRulesList(html) {
    // Extract list items from HTML
    const items = html.match(/<li>(.*?)<\/li>/g) || [];
    if (items.length > 0) {
        return items.map((item, i) => {
            const text = item.replace(/<\/?li>/g, '');
            return `
                <li>
                    <span class="rule-number">${String(i + 1).padStart(2, '0')}</span>
                    <div class="rule-text">${text}</div>
                </li>
            `;
        }).join('');
    }
    
    // If no list items, wrap the content
    return `<li><span class="rule-number">01</span><div class="rule-text">${html}</div></li>`;
}

window.renderRules = renderRules;

// --- Staff Functions ---
async function loadStaff() {
    const files = [
        'content/staff/owner.md',
        'content/staff/cowner.md',
        'content/staff/dev1.md',
        'content/staff/dev2.md',
        'content/staff/helper5.md',
        'content/staff/mod1.md',
        'content/staff/mod2.md',
        'content/staff/mod3.md',
        'content/staff/mod4.md',
        'content/staff/helper1.md',
        'content/staff/helper2.md',
        'content/staff/helper3.md',
        'content/staff/helper4.md'
    ];

    const staff = [];

    for (const file of files) {
        const data = await contentLoader.loadMarkdown(file);
        if (data && data.meta) {
            staff.push({
                ...data,
                slug: file.replace('content/staff/', '').replace('.md', ''),
                file: file
            });
        }
    }

    return staff;
}

async function renderStaff() {
    const container = document.getElementById('staff-container');
    if (!container) return;

    const staff = await loadStaff();

    if (!staff || staff.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>Žádný tým</h3>
                <p>Tým bude brzy přidán.</p>
            </div>
        `;
        return;
    }

    // Define categories and their order
    const categories = [
        { key: 'Owner', label: '👑 Owners', icon: '👑' },
        { key: 'Developer', label: '🔧 Developers', icon: '🔧' },
        { key: 'Moderátor', label: '🛡️ Moderátoři', icon: '🛡️' },
        { key: 'Helper', label: '💡 Helperi', icon: '💡' }
    ];

    // Group staff by role
    const grouped = {};
    categories.forEach(cat => { grouped[cat.key] = []; });
    
    staff.forEach(member => {
        const role = member.meta.role || '';
        if (grouped[role]) {
            grouped[role].push(member);
        } else {
            // Unknown role — put in a misc group
            if (!grouped['_other']) grouped['_other'] = [];
            grouped['_other'].push(member);
        }
    });

    // Build HTML
    let html = '';
    
    categories.forEach(cat => {
        const members = grouped[cat.key] || [];
        if (members.length === 0) return;

        html += `
            <div class="staff-category fade-in">
                <div class="staff-category-header">
                    <span class="staff-category-icon">${cat.icon}</span>
                    <h2>${cat.label}</h2>
                    <span class="staff-category-count">${members.length}</span>
                </div>
                <div class="staff-grid">
                    ${members.map(member => {
                        const initial = (member.meta.jmeno || '?')[0].toUpperCase();
                        return `
                            <div class="staff-card fade-in-scale">
                                <div class="staff-avatar">
                                    ${initial}
                                    <span class="staff-status ${member.meta.status || 'online'}"></span>
                                </div>
                                <h4>${escapeHtml(member.meta.jmeno || 'Neznámý')}</h4>
                                <div class="staff-role">${escapeHtml(member.meta.role || 'Člen týmu')}</div>
                                <div class="staff-desc">${escapeHtml(member.meta.popis || '')}</div>
                                ${member.meta.discord ? `<div style="margin-top:0.8rem;font-size:0.8rem;color:var(--text-muted)">💬 ${escapeHtml(member.meta.discord)}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    });

    // Handle uncategorized members
    if (grouped['_other'] && grouped['_other'].length > 0) {
        html += `
            <div class="staff-category fade-in">
                <div class="staff-category-header">
                    <span class="staff-category-icon">👤</span>
                    <h2>Ostatní</h2>
                    <span class="staff-category-count">${grouped['_other'].length}</span>
                </div>
                <div class="staff-grid">
                    ${grouped['_other'].map(member => {
                        const initial = (member.meta.jmeno || '?')[0].toUpperCase();
                        return `
                            <div class="staff-card fade-in-scale">
                                <div class="staff-avatar">
                                    ${initial}
                                    <span class="staff-status ${member.meta.status || 'online'}"></span>
                                </div>
                                <h4>${escapeHtml(member.meta.jmeno || 'Neznámý')}</h4>
                                <div class="staff-role">${escapeHtml(member.meta.role || 'Člen týmu')}</div>
                                <div class="staff-desc">${escapeHtml(member.meta.popis || '')}</div>
                                ${member.meta.discord ? `<div style="margin-top:0.8rem;font-size:0.8rem;color:var(--text-muted)">💬 ${escapeHtml(member.meta.discord)}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;

    // Trigger scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Also trigger child animations
                entry.target.querySelectorAll('.fade-in-scale').forEach(el => {
                    el.classList.add('visible');
                });
            }
        });
    }, { threshold: 0.1 });
    
    container.querySelectorAll('.staff-category').forEach(el => observer.observe(el));
}

window.renderStaff = renderStaff;

// --- FAQ Functions ---
async function loadFAQ() {
    const data = await contentLoader.loadJSON('content/faq.json');
    return data || [];
}

async function renderFAQ() {
    const container = document.getElementById('faq-container');
    if (!container) return;

    const faqItems = await loadFAQ();

    if (!faqItems || faqItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❓</div>
                <h3>Žádné FAQ</h3>
                <p>FAQ bude brzy přidáno.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = faqItems.map((item, i) => `
        <div class="faq-item fade-in">
            <button class="faq-question" onclick="toggleFAQ(this)">
                ${item.otazka || 'Otázka'}
                <span class="faq-icon">▾</span>
            </button>
            <div class="faq-answer">
                <p>${item.odpoved || ''}</p>
            </div>
        </div>
    `).join('');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    container.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

function toggleFAQ(button) {
    const item = button.closest('.faq-item');
    const isActive = item.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('active'));
    
    // Toggle current
    if (!isActive) {
        item.classList.add('active');
    }
}

window.renderFAQ = renderFAQ;
window.toggleFAQ = toggleFAQ;

// --- Vote Functions ---
async function renderVoteInfo() {
    const container = document.getElementById('vote-info');
    if (!container) return;

    // Load vote stats from JSON file
    const stats = await contentLoader.loadJSON('content/hlasy.json');
    if (!stats) {
        container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><span>Chyba načítání statistik</span></div>';
        return;
    }

    container.innerHTML = `
        <div class="vote-grid fade-in">
            <div class="vote-card">
                <div class="vote-icon">🗳️</div>
                <h3>Hlasuj na CraftList</h3>
                <p>Podpoř ShadowBlade SMP svým hlasem na CraftList. Každý hlas pomáhá serveru růst!</p>
                <a href="https://craftlist.org/sh-smp" target="_blank" rel="noopener" class="btn btn-primary">
                    Hlasovat na CraftList
                </a>
            </div>

            <div class="vote-card">
                <div class="vote-icon">📊</div>
                <h3>Statistiky hlasování</h3>
                <div class="stats-grid" style="margin-top:1rem;">
                    <div class="stat-card">
                        <div class="stat-icon">📈</div>
                        <div class="stat-number">${stats.total || 0}</div>
                        <div class="stat-label">Celkem hlasů</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📅</div>
                        <div class="stat-number">${stats.today || 0}</div>
                        <div class="stat-label">Dnes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📆</div>
                        <div class="stat-number">${stats.this_week || 0}</div>
                        <div class="stat-label">Tento týden</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🗓️</div>
                        <div class="stat-number">${stats.this_month || 0}</div>
                        <div class="stat-label">Tento měsíc</div>
                    </div>
                </div>
                ${stats.last_vote ? `<p style="margin-top:1rem;font-size:0.85rem;color:var(--text-muted);">Poslední hlas: ${stats.last_vote}</p>` : '<p style="margin-top:1rem;font-size:0.85rem;color:var(--text-muted);">Zatím nikdo nehlasoval. Buď první! 🎉</p>'}
            </div>
        </div>
        
        <div class="content-card fade-in" style="margin-top:1.5rem;">
            <h3>📜 Craft List – Co si můžeš vycraftit?</h3>
            <p>Přehled speciálních craftů dostupných na ShadowBlade SMP. Vše craftíš v běžném crafting table.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem;margin-top:1.5rem;">
                <div class="vote-card" style="text-align:left;">
                    <div style="font-size:1.5rem;margin-bottom:0.5rem;">🪵</div>
                    <h4>Compressed Wood</h4>
                    <p style="font-size:0.85rem;color:var(--text-muted);">9x kmen → 1x compressed</p>
                </div>
                <div class="vote-card" style="text-align:left;">
                    <div style="font-size:1.5rem;margin-bottom:0.5rem;">⛏️</div>
                    <h4>Compressed Cobble</h4>
                    <p style="font-size:0.85rem;color:var(--text-muted);">9x cobblestone → 1x compressed</p>
                </div>
                <div class="vote-card" style="text-align:left;">
                    <div style="font-size:1.5rem;margin-bottom:0.5rem;">💎</div>
                    <h4>Diamond Block zpět</h4>
                    <p style="font-size:0.85rem;color:var(--text-muted);">1x diamond block → 9x diamond</p>
                </div>
                <div class="vote-card" style="text-align:left;">
                    <div style="font-size:1.5rem;margin-bottom:0.5rem;">🔥</div>
                    <h4>Custom Enchant Book</h4>
                    <p style="font-size:0.85rem;color:var(--text-muted);">Kniha + 3x diamond + 1x netherite</p>
                </div>
                <div class="vote-card" style="text-align:left;">
                    <div style="font-size:1.5rem;margin-bottom:0.5rem;">🧪</div>
                    <h4>Speed Elixir</h4>
                    <p style="font-size:0.85rem;color:var(--text-muted);">Potion + sugar + redstone</p>
                </div>
                <div class="vote-card" style="text-align:left;">
                    <div style="font-size:1.5rem;margin-bottom:0.5rem;">🛡️</div>
                    <h4>Soulbound Armor</h4>
                    <p style="font-size:0.85rem;color:var(--text-muted);">Brnění + echo shard + netherite</p>
                </div>
            </div>
            <p style="text-align:center;margin-top:1.5rem;color:var(--text-muted);font-size:0.85rem;">
                🔄 Kompletní seznam craftů najdeš na <a href="wiki.html">Wiki</a>
            </p>
        </div>
    `;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    container.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

window.renderVoteInfo = renderVoteInfo;

// --- Utility Functions ---
function formatDate(dateStr) {
    if (!dateStr) return 'Neznámé datum';
    
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        
        return date.toLocaleDateString('cs-CZ', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

function getCategoryEmoji(category) {
    const emojis = {
        'Aktualizace': '⚡',
        'Oznámení': '📢',
        'Eventy': '🎮',
        'Soutěže': '🏆',
        'Vývoj serveru': '🔧',
        'Patch Notes': '📝'
    };
    return emojis[category] || '📰';
}

function getCategoryIcon(category) {
    const icons = {
        'Obecná pravidla': '📋',
        'Chat': '💬',
        'PvP': '⚔️',
        'Stavění': '🏗️',
        'Ekonomika': '💰',
        'Cheaty': '🚫',
        'Tresty': '⚖️'
    };
    return icons[category] || '📌';
}

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
}

// --- Auto-initialize based on page ---
document.addEventListener('DOMContentLoaded', () => {
    const bodyId = document.body.id;
    
    if (bodyId === 'news-page') {
        renderNews();
        
        // Setup filter buttons
        document.querySelectorAll('.filter-tag').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.getAttribute('data-filter') || 'all';
                const search = document.getElementById('news-search')?.value || '';
                renderNews(filter, search);
            });
        });

        // Setup search
        const searchInput = document.getElementById('news-search');
        if (searchInput) {
            let timeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    const activeFilter = document.querySelector('.filter-tag.active');
                    const filter = activeFilter?.getAttribute('data-filter') || 'all';
                    renderNews(filter, searchInput.value);
                }, 300);
            });
        }
    }
    
    if (bodyId === 'wiki-page') {
        renderWiki();
    }
    
    if (bodyId === 'rules-page') {
        renderRules();
    }
    
    if (bodyId === 'team-page') {
        renderStaff();
    }
    
    if (bodyId === 'faq-page') {
        renderFAQ();
    }
    
    if (bodyId === 'vote-page') {
        renderVoteInfo();
    }
});
