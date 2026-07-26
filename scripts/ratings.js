/* ============================================
   ShadowBlade SMP - Star Rating System
   Jednoduché hodnocení hvězdičkami (1-5)
   ============================================ */

'use strict';

// --- Storage ---
const RatingDB = {
    key: 'shadowblade_ratings',

    load() {
        try {
            const data = localStorage.getItem(this.key);
            if (data) {
                const parsed = JSON.parse(data);
                return Array.isArray(parsed.ratings) ? parsed.ratings : [];
            }
        } catch (e) { /* ignore */ }
        return [];
    },

    save(ratings) {
        try {
            localStorage.setItem(this.key, JSON.stringify({ ratings, updated: Date.now() }));
        } catch (e) { /* ignore */ }
    },

    add(ratings, stars) {
        ratings.push({ stars });
        this.save(ratings);
    },

    average(ratings) {
        if (!ratings.length) return 0;
        return ratings.reduce((a, r) => a + r.stars, 0) / ratings.length;
    },

    breakdown(ratings) {
        const b = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratings.forEach(r => { if (r.stars >= 1 && r.stars <= 5) b[r.stars]++; });
        return b;
    }
};

// --- UI ---
function initRating() {
    const el = document.getElementById('rating-section');
    if (!el) return;
    render(el);
}

function render(el) {
    const ratings = RatingDB.load();
    const avg = RatingDB.average(ratings);
    const total = ratings.length;
    const bd = RatingDB.breakdown(ratings);
    const max = Math.max(...Object.values(bd), 1);

    el.innerHTML = `
        <div class="rating-header">
            <h2>⭐ Hodnocení serveru</h2>
            <p>Ohodnoť ShadowBlade SMP — klikni na hvězdičky</p>
        </div>

        <div class="rating-main">
            <div class="rating-stars-display">
                <div class="rating-average">${avg > 0 ? avg.toFixed(1) : '—'}</div>
                <div class="stars-container" id="interactive-stars">
                    ${'12345'.split('').map(i =>
                        `<span class="star" data-val="${i}"></span>`
                    ).join('')}
                </div>
                <div class="rating-average-label">průměr</div>
                <div class="rating-total">${total}× hodnoceno</div>
            </div>

            <div class="rating-divider"></div>

            <div class="rating-breakdown">
                ${[5,4,3,2,1].map(s => {
                    const c = bd[s] || 0;
                    const p = max > 0 ? (c / max) * 100 : 0;
                    return `
                        <div class="breakdown-row">
                            <span class="breakdown-stars">${s}★</span>
                            <div class="breakdown-bar-track">
                                <div class="breakdown-bar-fill" data-pct="${p}" style="width:0%"></div>
                            </div>
                            <span class="breakdown-count">${c}×</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;

    // Animate bars
    requestAnimationFrame(() => requestAnimationFrame(() => {
        el.querySelectorAll('.breakdown-bar-fill').forEach(bar => {
            bar.style.width = bar.getAttribute('data-pct') + '%';
        });
    }));

    // Interactive stars — click = instant rate
    const stars = el.querySelectorAll('#interactive-stars .star');
    stars.forEach(star => {
        star.addEventListener('mouseenter', function () {
            const v = parseInt(this.getAttribute('data-val'));
            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-val')) <= v) s.classList.add('hovered');
                else s.classList.remove('hovered');
            });
        });

        star.addEventListener('mouseleave', function () {
            stars.forEach(s => s.classList.remove('hovered'));
        });

        star.addEventListener('click', function () {
            const v = parseInt(this.getAttribute('data-val'));
            const r = RatingDB.load();
            RatingDB.add(r, v);

            // Update counts in place without full re-render
            const newBd = RatingDB.breakdown(r);
            const newTotal = r.length;
            const newAvg = RatingDB.average(r);
            const newMax = Math.max(...Object.values(newBd), 1);

            // Update average & total
            el.querySelector('.rating-average').textContent = newAvg.toFixed(1);
            el.querySelector('.rating-total').textContent = newTotal + '× hodnoceno';

            // Update breakdown bars
            el.querySelectorAll('.breakdown-row').forEach((row, i) => {
                const starVal = 5 - i;
                const cnt = newBd[starVal] || 0;
                const pct = newMax > 0 ? (cnt / newMax) * 100 : 0;
                row.querySelector('.breakdown-count').textContent = cnt + '×';
                const bar = row.querySelector('.breakdown-bar-fill');
                bar.style.width = pct + '%';
            });

            // Visual feedback — highlight clicked stars
            stars.forEach(s => {
                s.classList.remove('hovered', 'active');
                if (parseInt(s.getAttribute('data-val')) <= v) s.classList.add('active');
            });

            // Sound
            if (window.SoundManager && SoundManager.play) SoundManager.play('click');

            // Toast
            window.showToast(`⭐ Děkujeme! Hodnocení ${v}/5 uloženo`, 'success');
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.body.id === 'rating-page') initRating();
});
