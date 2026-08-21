/**
 * NEXUS THEME ENGINE v4.1 (Heat Haze & Ripples)
 * Features:
 * - Deep Obsidian Background
 * - Fire Side (Left): Upward "Heat Haze" displacement animation
 * - Water Side (Right): Fluid "Ripple" displacement animation
 * - Subtle Glassmorphism
 * - Performance optimized: Animation pauses when browser tab is inactive
 */

document.addEventListener('DOMContentLoaded', () => {
    initNexusTheme();
});

function initNexusTheme() {
    injectStyles();
    injectStructure();
    startElementalEngine();
}

function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* GLOBAL CURSOR STYLES */
        body, a, button, select {
            cursor: default;
        }
        
        a, button, input[type="submit"], input[type="button"], .clickable {
            cursor: pointer;
        }

        input[type="text"], input[type="password"], input[type="email"], input[type="date"], textarea {
            cursor: text;
        }

        /* CONTAINER */
        #nexus-background {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: -1;
            background: #000000;
            overflow: hidden;
            pointer-events: none;
        }

        /* ELEMENTAL ZONES */
        .elemental-zone {
            position: absolute;
            width: 60vw;
            height: 100vh;
            top: 0;
            opacity: 0.4;
            mix-blend-mode: screen;
        }

        /* FIRE SIDE (Left) */
        #zone-fire {
            left: -10vw;
            background: radial-gradient(ellipse at 30% 50%, #ff4500 0%, #8b0000 40%, transparent 70%);
            mask-image: linear-gradient(to right, black 0%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, black 0%, transparent 100%);
            filter: url(#heatFilter);
        }

        /* WATER SIDE (Right) */
        #zone-water {
            right: -10vw;
            background: radial-gradient(ellipse at 70% 50%, #00bfff 0%, #00008b 40%, transparent 70%);
            mask-image: linear-gradient(to left, black 0%, transparent 100%);
            -webkit-mask-image: linear-gradient(to left, black 0%, transparent 100%);
            filter: url(#waterFilter);
        }

        /* VIGNETTE OVERLAY */
        #nexus-vignette {
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at center, transparent 20%, #000000 100%);
            opacity: 0.7;
        }

        /* CARD STYLES */
        .glass-card, 
        .bg-neutral-900\\/60,
        .bg-neutral-900\\/80,
        .bg-black\\/20 {
            background: rgba(10, 10, 10, 0.4) !important;
            backdrop-filter: blur(12px) !important;
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
            transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .glass-card:hover,
        .bg-neutral-900\\/60:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.15);
        }
    `;
    document.head.appendChild(style);
}

function injectStructure() {
    const existing = document.getElementById('nexus-background');
    if (existing) existing.remove();

    const html = `
        <div id="nexus-background">
            <div id="zone-fire" class="elemental-zone"></div>
            <div id="zone-water" class="elemental-zone"></div>
            <div id="nexus-vignette"></div>

            <!-- FILTERS -->
            <svg style="width:0; height:0; position:absolute;">
                <defs>
                    <!-- FIRE HEAT FILTER -->
                    <filter id="heatFilter">
                        <feTurbulence id="heat-turb" type="turbulence" baseFrequency="0.01 0.03" numOctaves="2" seed="1" />
                        <feDisplacementMap in="SourceGraphic" scale="40" xChannelSelector="R" yChannelSelector="G" />
                        <feGaussianBlur stdDeviation="0.5" /> 
                    </filter>

                    <!-- WATER RIPPLE FILTER -->
                    <filter id="waterFilter">
                        <feTurbulence id="water-turb" type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="5" />
                        <feDisplacementMap in="SourceGraphic" scale="60" xChannelSelector="R" yChannelSelector="B" />
                    </filter>
                </defs>
            </svg>
        </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', html);
}

function startElementalEngine() {
    const heatTurb = document.getElementById('heat-turb');
    const waterTurb = document.getElementById('water-turb');

    if (!heatTurb || !waterTurb) return;

    let frames = 0;
    let isRunning = true;

    // Pause animation when tab is in background to preserve CPU/GPU battery
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            isRunning = false;
        } else if (!isRunning) {
            isRunning = true;
            requestAnimationFrame(animate);
        }
    });

    const animate = () => {
        if (!isRunning) return;

        frames++;

        // Heat Animation (Rising Frequency Oscillations)
        const heatLowY = 0.03;
        const heatVarY = 0.005 * Math.sin(frames * 0.05);
        const heatX = 0.01;
        heatTurb.setAttribute('baseFrequency', `${heatX} ${heatLowY + heatVarY}`);

        // Water Animation (Smooth Undulation)
        const waterGlobal = 0.008 + 0.002 * Math.sin(frames * 0.01);
        waterTurb.setAttribute('baseFrequency', `${waterGlobal} ${waterGlobal}`);

        requestAnimationFrame(animate);
    };

    animate();
}

