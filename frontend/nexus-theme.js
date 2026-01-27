/**
 * NEXUS THEME ENGINE v4.0 (Heat Haze & Ripples)
 * Concept 2 Implementation
 * Features:
 * - Deep Obsidian Background
 * - Fire Side (Left): Upward "Heat Haze" displacement animation
 * - Water Side (Right): Fluid "Ripple" displacement animation
 * - Subtle Glassmorphism (No heavy magnetic pulls)
 */

document.addEventListener('DOMContentLoaded', () => {
    initNexusTheme();
});

function initNexusTheme() {
    console.log('NEXUS: Initializing Heat Haze & Ripples...');
    injectStyles();
    injectStructure();
    startElementalEngine();
}

function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* GLOBAL CURSOR RESET */
        body, a, button, input, select, textarea {
            cursor: default;
        }
        
        a, button, input[type="submit"], .clickable {
            cursor: pointer;
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
            opacity: 0.4; /* Subtle visibility */
            mix-blend-mode: screen;
        }

        /* FIRE SIDE (Left) */
        #zone-fire {
            left: -10vw;
            background: radial-gradient(ellipse at 30% 50%, #ff4500 0%, #8b0000 40%, transparent 70%);
            mask-image: linear-gradient(to right, black 0%, transparent 100%);
            -webkit-mask-image: linear-gradient(to right, black 0%, transparent 100%);
            filter: url(#heatFilter); /* Apply Heat Distortion */
        }

        /* WATER SIDE (Right) */
        #zone-water {
            right: -10vw;
            background: radial-gradient(ellipse at 70% 50%, #00bfff 0%, #00008b 40%, transparent 70%);
            mask-image: linear-gradient(to left, black 0%, transparent 100%);
            -webkit-mask-image: linear-gradient(to left, black 0%, transparent 100%);
            filter: url(#waterFilter); /* Apply Ripple Distortion */
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
    // Remove existing if present
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
                    <!-- FIRE HEAT FILTER: Vertical, jagged turbulence -->
                    <filter id="heatFilter">
                        <feTurbulence id="heat-turb" type="turbulence" baseFrequency="0.01 0.03" numOctaves="2" seed="1" />
                        <feDisplacementMap in="SourceGraphic" scale="40" xChannelSelector="R" yChannelSelector="G" />
                        <!-- Blur slightly to soften the noise edges -->
                        <feGaussianBlur stdDeviation="0.5" /> 
                    </filter>

                    <!-- WATER RIPPLE FILTER: Smoother, fractal noise -->
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

    // Config
    // Heat: Fast Y movement, subtle X jitter
    // Water: Slow, smooth rolling movement

    function animate() {
        frames++;

        // Heat Animation (Rising)
        // Adjusting baseFrequency Y creates a "stretching/compressing" look
        // We add a tiny seed shift occasionally or phase shift if using simpler noise
        // For displacement map, animating baseFrequency is the smoothest "distortion" loop

        // Heat: High frequency Y, oscilating slightly
        const heatLowY = 0.03;
        const heatVarY = 0.005 * Math.sin(frames * 0.05); // Rapid flicker
        const heatX = 0.01;

        // To make it look like it's "rising", we shift opacity or phase usually, 
        // but here we will oscillate the FREQUENCY to simulate heat waves expanding/contracting
        heatTurb.setAttribute('baseFrequency', `${heatX} ${heatLowY + heatVarY}`);

        // Water Animation (Undulating)
        // Slow rolling waves
        const waterGlobal = 0.008 + 0.002 * Math.sin(frames * 0.01);
        waterTurb.setAttribute('baseFrequency', `${waterGlobal} ${waterGlobal}`);

        requestAnimationFrame(animate);
    }

    animate();
}
