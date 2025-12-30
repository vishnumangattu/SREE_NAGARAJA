import { SearchMoonPhase, GeoVector, Body } from 'astronomy-engine';

const date = new Date();
console.log("Testing SearchMoonPhase...");
try {
    const res = SearchMoonPhase(0, date, 30);
    console.log("SearchMoonPhase (New Moon):", res?.date);
} catch (e) { console.error("SearchMoonPhase failed:", e); }

console.log("Testing GeoVector...");
try {
    const vec = GeoVector(Body.Moon, date, false);
    console.log("GeoVector:", vec);
} catch (e) { console.error("GeoVector failed:", e); }
