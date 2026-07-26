/* ============================================
   ShadowBlade SMP - Server Status
   Automatické načítání stavu serveru
   ============================================ */

'use strict';

// --- HTML Escape (prevent XSS) ---
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

const SERVER_IP = 'shadowbladesmp.org';
const API_URL = `https://api.mcsrvstat.us/3/${SERVER_IP}`;
const REFRESH_INTERVAL = 30000; // 30 seconds

let statusData = null;

// --- Initialize Status ---
document.addEventListener('DOMContentLoaded', () => {
    fetchServerStatus();
    setInterval(fetchServerStatus, REFRESH_INTERVAL);
});

// --- Fetch Status ---
async function fetchServerStatus() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        statusData = data;
        updateStatusUI(data);
        updateStats(data);
    } catch (error) {
        console.warn('Failed to fetch server status:', error);
        setOffline();
    }
}

// --- Update Status UI ---
function updateStatusUI(data) {
    const cards = document.querySelectorAll('.server-status-card');
    if (cards.length === 0) return;

    cards.forEach(card => {
        if (data.online) {
            // Update server favicon
            const favicon = card.querySelector('.server-favicon');
            const statusIcon = card.querySelector('.status-icon');
            if (favicon && data.icon) {
                favicon.src = data.icon;
                favicon.style.display = 'block';
                if (statusIcon) statusIcon.style.display = 'none';
            } else if (favicon) {
                favicon.style.display = 'none';
                if (statusIcon) statusIcon.style.display = 'flex';
            }

            // Update status icon
            const icon = card.querySelector('.status-icon-box .status-icon');
            if (icon && !data.icon) {
                icon.className = 'status-icon online';
                icon.textContent = '🟢';
            } else if (icon) {
                icon.className = 'status-icon online';
            }

            // Update status label
            const label = card.querySelector('.status-label');
            if (label) label.textContent = 'Stav serveru';

            // Update status value
            const value = card.querySelector('.status-value');
            if (value) {
                value.textContent = '🟢 Online';
                value.style.color = '#10b981';
            }

            // Update MOTD
            const motdEl = card.querySelector('.status-motd');
            if (motdEl && data.motd) {
                const motdLines = data.motd.clean || [];
                if (motdLines.length > 0) {
                    motdEl.innerHTML = motdLines.map(line => 
                        `<span class="motd-line">${escapeHtml(line)}</span>`
                    ).join('');
                    motdEl.style.display = 'block';
                } else {
                    motdEl.style.display = 'none';
                }
            }

            // Update details
            const details = card.querySelector('.status-details');
            if (details) {
                const players = data.players ? data.players.online : '?';
                const maxPlayers = data.players ? data.players.max : '?';
                const version = data.version || 'Neznámá';
                const ping = data.debug ? (data.debug.ping || '?') : '?';

                details.innerHTML = `
                    <span>Hráči: <strong>${players}/${maxPlayers}</strong></span>
                    <span>Verze: <strong>${version}</strong></span>
                    <span>Ping: <strong>${ping}ms</strong></span>
                `;
            }

            // Update hero badge
            updateHeroBadge(true);
        } else {
            setOffline(card);
        }
    });
}

// --- Set Offline ---
function setOffline(card = null) {
    const cards = card ? [card] : document.querySelectorAll('.server-status-card');
    
    cards.forEach(c => {
        // Reset favicon
        const favicon = c.querySelector('.server-favicon');
        if (favicon) {
            favicon.style.display = 'none';
            favicon.src = '';
        }
        
        // Show fallback icon
        const iconBox = c.querySelector('.status-icon-box .status-icon');
        if (iconBox) {
            iconBox.className = 'status-icon offline';
            iconBox.style.display = 'flex';
            iconBox.textContent = '🔴';
        }

        // Hide MOTD
        const motdEl = c.querySelector('.status-motd');
        if (motdEl) {
            motdEl.style.display = 'none';
            motdEl.innerHTML = '';
        }

        const label = c.querySelector('.status-label');
        if (label) label.textContent = 'Stav serveru';

        const value = c.querySelector('.status-value');
        if (value) {
            value.textContent = '🔴 Server je momentálně offline.';
            value.style.color = '#ef4444';
        }

        const details = c.querySelector('.status-details');
        if (details) {
            details.innerHTML = '<span>Zkuste to prosím později</span>';
        }
    });

    updateHeroBadge(false);
}

// --- Update Hero Badge ---
function updateHeroBadge(online) {
    const badge = document.querySelector('.hero-badge');
    if (!badge) return;

    const dot = badge.querySelector('.status-dot');
    const text = badge.querySelector('.status-text');
    
    if (dot) {
        dot.className = `status-dot ${online ? 'online' : ''}`;
    }
    
    if (text) {
        text.textContent = online ? 
            'Server je online' : 
            'Server je offline';
    }
}

// --- Update Stats ---
function updateStats(data) {
    if (!data.online) {
        // Set stats to 0 / loading when offline
        document.querySelectorAll('.stat-number[data-stat]').forEach(el => {
            if (el.getAttribute('data-stat') === 'online-players') {
                animateNumber(el, 0);
            }
        });
        return;
    }

    // Update player count
    const playerCount = document.querySelector('.stat-number[data-stat="online-players"]');
    if (playerCount && data.players) {
        animateNumber(playerCount, data.players.online || 0);
    }
}

// --- Animate Number ---
function animateNumber(element, target) {
    const current = parseInt(element.textContent) || 0;
    const duration = 1000;
    const startTime = performance.now();
    const diff = target - current;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(current + diff * eased);
        
        element.textContent = value;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// --- Get Status Data (for other modules) ---
function getServerStatus() {
    return statusData;
}

window.getServerStatus = getServerStatus;
