import { MoonPhase, Body, SearchRelativeLongitude, Observer } from 'astronomy-engine';

const date = new Date();
console.log("Testing MoonPhase...");
try {
    const p = MoonPhase(date);
    console.log("MoonPhase:", p);
} catch (e) { console.error("MoonPhase failed:", e); }

console.log("Testing SearchRelativeLongitude...");
try {
    // SearchRelativeLongitude(body1, body2, target, date)
    const res = SearchRelativeLongitude(Body.Moon, Body.Sun, 0, date);
    console.log("SearchRelativeLongitude:", res);
} catch (e) { console.error("SearchRelativeLongitude failed:", e); }
