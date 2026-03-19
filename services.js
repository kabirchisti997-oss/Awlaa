/**
 * services.js
 * Renders the high-level Awlaa Global Capabilities into the Division Section.
 * Voice: Category headline + individual works both speak directly via speakWeb.
 */

import { speakWeb } from './web_voice.js';

const capabilitiesData = [
    {
        title: "AI Development & Automation",
        icon: '<i class="fas fa-brain"></i>',
        works: [
            { name: "AwlaaCore AI Systems" },
            { name: "Strategic Business Automation" },
            { name: "Intelligent Process Support" }
        ]
    },
    {
        title: "Integrated Digital Infrastructure",
        icon: '<i class="fas fa-network-wired"></i>',
        works: [
            { name: "Cloud & Server Architecture" },
            { name: "Secure Enterprise Networks" },
            { name: "Global Connectivity Solutions" }
        ]
    }
];

function renderServices() {
    const container = document.getElementById('divisions-container');
    if (!container) return;

    container.innerHTML = '';

    capabilitiesData.forEach(category => {
        // ── CATEGORY CARD ──────────────────────────────────────────────
        const card = document.createElement('div');
        card.className = 'division-card';

        // Header (Headline) — speak category title on click
        const header = document.createElement('div');
        header.className = 'division-header';
        header.innerHTML = `
            <span class="division-icon">${category.icon}</span>
            <span class="division-title">${category.title}</span>
            <i class="fas fa-chevron-down division-arrow"></i>
        `;

        header.addEventListener('click', () => {
            const isOpen = card.classList.toggle('open');
            if (isOpen) {
                // User specifically asked for "Okay" + headline
                speakWeb(category.title);
            }
        });

        // Works list — speak each work name on click
        const worksList = document.createElement('div');
        worksList.className = 'division-works';

        category.works.forEach(work => {
            const workItem = document.createElement('div');
            workItem.className = 'division-work-item';
            workItem.innerHTML = `
                <i class="fas fa-circle-dot work-dot"></i>
                <span>${work.name}</span>
            `;
            workItem.addEventListener('click', (e) => {
                e.stopPropagation();
                speakWeb(work.name);
            });
            worksList.appendChild(workItem);
        });

        card.appendChild(header);
        card.appendChild(worksList);
        container.appendChild(card);
    });
}

document.addEventListener('DOMContentLoaded', renderServices);