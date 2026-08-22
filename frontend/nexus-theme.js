/**
 * NEXUS THEME ENGINE v5.0 (High-Performance Ambient Engine)
 * Features:
 * - Ultra-low CPU/GPU footprint (pure CSS hardware-accelerated ambient mesh)
 * - Zero JS requestAnimationFrame loops / Zero SVG displacement filter overhead
 * - Cohesive dark glassmorphic design system tokens
 * - Respects prefers-reduced-motion
 * - Non-invasive styling (no !important Tailwind hijacking)
 */

(function () {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNexusTheme);
    } else {
        initNexusTheme();
    }

    function initNexusTheme() {
        injectStyles();
        injectStructure();
    }

    function injectStyles() {
        if (document.getElementById('nexus-theme-styles')) return;

        const style = document.createElement('style');
        style.id = 'nexus-theme-styles';
        style.textContent = `
            :root {
                --nexus-bg: #050507;
                --nexus-surface: rgba(18, 18, 22, 0.75);
                --nexus-surface-hover: rgba(26, 26, 32, 0.85);
                --nexus-surface-solid: #121216;
                --nexus-border: rgba(255, 255, 255, 0.08);
                --nexus-border-hover: rgba(234, 179, 8, 0.35);
                --nexus-accent: #eab308;
                --nexus-accent-glow: rgba(234, 179, 8, 0.15);
            }

            /* BASE SMOOTHNESS & DEEP OBSIDIAN CANVAS */
            html {
                background-color: var(--nexus-bg);
                color-scheme: dark;
            }

            body {
                background-color: var(--nexus-bg);
                color: #e5e7eb;
                overflow-x: hidden;
            }

            /* SELECTION */
            ::selection {
                background: rgba(234, 179, 8, 0.3);
                color: #ffffff;
            }

            /* ACCESSIBLE CUSTOM SCROLLBARS */
            ::-webkit-scrollbar {
                width: 7px;
                height: 7px;
            }
            ::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.4);
            }
            ::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.15);
                border-radius: 9999px;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.28);
            }

            /* FIXED AMBIENT CANVAS */
            #nexus-canvas {
                position: fixed;
                inset: 0;
                width: 100vw;
                height: 100vh;
                z-index: 0;
                pointer-events: none;
                overflow: hidden;
                background: radial-gradient(circle at 50% 0%, #0c0d14 0%, #050507 70%);
            }

            /* GPU-ACCELERATED AMBIENT GLOW ORBS */
            .nexus-orb {
                position: absolute;
                border-radius: 50%;
                filter: blur(90px);
                opacity: 0.28;
                pointer-events: none;
                transform: translate3d(0, 0, 0);
                will-change: transform, opacity;
            }

            .nexus-orb-amber {
                top: -10vw;
                left: 15vw;
                width: 45vw;
                height: 45vw;
                background: radial-gradient(circle, #f59e0b 0%, #b45309 50%, transparent 80%);
                animation: nexusFloatAmber 24s ease-in-out infinite alternate;
            }

            .nexus-orb-blue {
                bottom: -10vw;
                right: 10vw;
                width: 50vw;
                height: 50vw;
                background: radial-gradient(circle, #3b82f6 0%, #1d4ed8 45%, transparent 75%);
                opacity: 0.18;
                animation: nexusFloatBlue 28s ease-in-out infinite alternate;
            }

            .nexus-orb-purple {
                top: 40vh;
                right: -10vw;
                width: 35vw;
                height: 35vw;
                background: radial-gradient(circle, #8b5cf6 0%, #6d28d9 50%, transparent 80%);
                opacity: 0.14;
                animation: nexusFloatPurple 32s ease-in-out infinite alternate;
            }

            /* SUBTLE GRID TEXTURE OVERLAY */
            #nexus-grid-overlay {
                position: absolute;
                inset: 0;
                background-image: linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
                                  linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
                background-size: 48px 48px;
                mask-image: radial-gradient(ellipse at 50% 50%, black 40%, transparent 85%);
                -webkit-mask-image: radial-gradient(ellipse at 50% 50%, black 40%, transparent 85%);
            }

            /* VIGNETTE SHADOW */
            #nexus-vignette {
                position: absolute;
                inset: 0;
                background: radial-gradient(circle at center, transparent 30%, rgba(0, 0, 0, 0.65) 100%);
            }

            /* KEYFRAMES */
            @keyframes nexusFloatAmber {
                0% { transform: translate3d(0, 0, 0) scale(1); }
                50% { transform: translate3d(3vw, 4vh, 0) scale(1.08); }
                100% { transform: translate3d(-3vw, 2vh, 0) scale(0.95); }
            }

            @keyframes nexusFloatBlue {
                0% { transform: translate3d(0, 0, 0) scale(1); }
                50% { transform: translate3d(-4vw, -5vh, 0) scale(1.1); }
                100% { transform: translate3d(2vw, -2vh, 0) scale(0.92); }
            }

            @keyframes nexusFloatPurple {
                0% { transform: translate3d(0, 0, 0) scale(1); }
                50% { transform: translate3d(-3vw, 3vh, 0) scale(1.06); }
                100% { transform: translate3d(2vw, -4vh, 0) scale(0.96); }
            }

            /* ACCESSIBILITY REDUCED MOTION */
            @media (prefers-reduced-motion: reduce) {
                .nexus-orb {
                    animation: none !important;
                }
            }

            /* GLASSMORPHISM PRIMITIVES */
            .nexus-card {
                background: var(--nexus-surface);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid var(--nexus-border);
                box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                            border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1),
                            box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .nexus-card-interactive:hover {
                transform: translateY(-2px);
                border-color: var(--nexus-border-hover);
                box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.5), 0 0 20px 0 var(--nexus-accent-glow);
            }
        `;
        document.head.appendChild(style);
    }

    function injectStructure() {
        const existing = document.getElementById('nexus-canvas');
        if (existing) existing.remove();

        const canvas = document.createElement('div');
        canvas.id = 'nexus-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        canvas.innerHTML = `
            <div class="nexus-orb nexus-orb-amber"></div>
            <div class="nexus-orb nexus-orb-blue"></div>
            <div class="nexus-orb nexus-orb-purple"></div>
            <div id="nexus-grid-overlay"></div>
            <div id="nexus-vignette"></div>
        `;

        document.body.insertAdjacentElement('afterbegin', canvas);
    }
})();
