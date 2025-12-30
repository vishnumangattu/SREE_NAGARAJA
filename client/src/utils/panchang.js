
import { Body, Equator, Ecliptic, Horizon, Observer, SearchRelativeLongitude, SearchHourAngle, GeoVector, MoonPhase, SearchMoonPhase, SearchRiseSet } from 'astronomy-engine';
console.log("Body imported:", Body);

// Constants
const TITHI_DEGREES = 12.0;
const NAKSHATRA_DEGREES = 13.0 + (20.0 / 60.0); // 13.3333...

const TITHI_NAMES = [
    "Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashti",
    "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
    "Trayodashi", "Chaturdashi", "Purnima",
    "Prathama", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashti",
    "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
    "Trayodashi", "Chaturdashi", "Amavasya"
];

const NAKSHATRA_NAMES = [
    "Ashwathi", "Bharani", "Karthika", "Rohini", "Makiryam", "Thiruvathira",
    "Punartham", "Pooyam", "Aayilyam", "Makam", "Pooram", "Uthram",
    "Atham", "Chithra", "Chothi", "Vishakham", "Anizham", "Thrikketta",
    "Moolam", "Pooradam", "Uthradam", "Thiruvonam", "Avittam", "Chathayam",
    "Poororuttathi", "Uthrattathi", "Revathi"
];

// Location: Kerala (approx Center)
const OBSERVER_LATITUDE = 9.9312;
const OBSERVER_LONGITUDE = 76.2673;

/**
 * Calculates Panchang data for a given date
 * @param {Date} date 
 */
export const calculatePanchangData = (date) => {
    // 1. Calculate Sunrise
    const observer = new Observer(OBSERVER_LATITUDE, OBSERVER_LONGITUDE, 0);
    const dateNoon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0); // Noon

    let sunrise = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 0, 0); // Default 6 AM

    try {
        const sunriseInfo = SearchRiseSet(Body.Sun, observer, +1, dateNoon, 1);
        if (sunriseInfo && sunriseInfo.date) {
            sunrise = sunriseInfo.date;
        }
    } catch (e) {
        console.warn("Sunrise calc failed, using 6AM", e);
    }

    // 2. Calculate data at Sunrise (Traditional Panchang is detailed at Sunrise)
    const tithiDetails = getTithiDetails(sunrise, observer);
    const nakshatraDetails = getNakshatraDetails(sunrise, observer);

    // 3. Search for End Time (When Tithi/Nakshatra changes)
    const tithiEndTime = findNextTithiStart(sunrise, observer, tithiDetails.index);
    const nakshatraEndTime = findNextNakshatraStart(sunrise, observer, nakshatraDetails.index);

    const tithiDurationMs = tithiEndTime ? (tithiEndTime.getTime() - sunrise.getTime()) : -1;
    const nakshatraDurationMs = nakshatraEndTime ? (nakshatraEndTime.getTime() - sunrise.getTime()) : -1;

    return {
        tithi: {
            name: TITHI_NAMES[tithiDetails.index - 1] || "",
            nazhika: msToNazhika(tithiDurationMs)
        },
        nakshatra: {
            name: NAKSHATRA_NAMES[nakshatraDetails.index - 1] || "",
            nazhika: msToNazhika(nakshatraDurationMs)
        }
    };
};

function msToNazhika(ms) {
    if (ms < 0) return "0-0"; // Already ended?

    // 1 Nazhika = 24 mins = 24 * 60 * 1000 ms
    const totalMinutes = ms / (1000 * 60);
    const nazhika = Math.floor(totalMinutes / 24);
    const remainderMinutes = totalMinutes % 24;

    // 1 Vinazhika = 24 seconds = 0.4 minutes
    // OR: 60 Vinazhika = 1 Nazhika (= 24 mins)
    // So 1 Vinazhika = 24/60 mins = 0.4 mins
    const vinazhika = Math.floor(remainderMinutes / 0.4);

    return `${nazhika}-${vinazhika}`;
}

// ---------------- Helpers ---------------- //

// ---------------- Helpers ---------------- //

function getTithiDetails(date, observer) {
    // Tithi = Moon Longitude - Sun Longitude
    // 1 Tithi = 12 degrees
    // We can use MoonPhase() which returns degrees (0-360) directly!
    // 0 = New Moon, 180 = Full Moon.

    const phase = MoonPhase(date); // 0 to 360
    const tithiIndex = Math.floor(phase / 12.0) + 1; // 1 to 30
    return { index: tithiIndex, currentPhase: phase };
}

function getNakshatraDetails(date, observer) {
    // Nakshatra = Moon Ecliptic Longitude (Sidereal?)
    // Astronomy engine gives Tropical by default.
    // We need Sidereal (Nirayana).
    // Ayanamsa is required. ~24 degrees.
    // Let's calculate approx or finding a way.
    // Astronomy engine supports 'EclipticGeo' (Geocentric Ecliptic coordinates).
    // It returns longitude relative to Equinox J2000 (Tropical).
    // We subtract Ayanamsa (Lahiri).

    // Approx Lahiri Ayanamsa for 2025: ~24.1 degrees (increasing slightly).
    const AYANAMSA = 24.12;

    // Correct usage: Get Vector then convert to Ecliptic
    const vec = GeoVector(Body.Moon, date, false);
    const moonPos = Ecliptic(vec);

    let siderealLon = moonPos.lon - AYANAMSA;
    if (siderealLon < 0) siderealLon += 360;

    const nakshatraIndex = Math.floor(siderealLon / 13.333333333) + 1; // 1 to 27
    return { index: nakshatraIndex, currentLon: siderealLon };
}

// Search for next Tithi Start (Angle crossing multiple of 12)
function findNextTithiStart(startDate, observer, currentTithiIndex) {
    // Target phase = currentTithiIndex * 12.0
    const targetPhase = (currentTithiIndex * 12.0) % 360;
    // If target is 360, it wraps to 0.

    // Use SearchMoonPhase directly
    const result = SearchMoonPhase(targetPhase, startDate, 2); // Limit 2 days
    return result ? result.date : null;
}

// Search for next Nakshatra Start (Moon crossing multiple of 13.3333)
function findNextNakshatraStart(startDate, observer, currentNakshatraIndex) {
    // Target Lon = currentNakshatraIndex * 13.3333
    // But we need Sidereal.
    // So Tropical Target = Sidereal Target + Ayanamsa

    const AYANAMSA = 24.12;
    const targetSidereal = currentNakshatraIndex * (360 / 27);
    let targetTropical = targetSidereal + AYANAMSA;
    if (targetTropical >= 360) targetTropical -= 360;

    // Search for Moon Longitude = targetTropical
    // Use SearchEclipticGeo? No standard function "SearchLongitude".
    // We iterate step by step or write a small binary search wrapper.
    // Given strictness, let's step hour by hour then minute by minute?
    // Or just +24 hours / ~360 degrees? Moon moves ~13 deg/day.
    // 1 Nakshatra ~ 1 day.

    // Simple Binary Search
    let min = startDate.getTime();
    let max = min + 24 * 60 * 60 * 1000 * 1.5; // Look ahead 1.5 days max

    for (let i = 0; i < 15; i++) { // 15 iterations ~ 1 minute precision
        const mid = (min + max) / 2;
        const d = new Date(mid);
        const vec = GeoVector(Body.Moon, d, false);
        const moonPos = Ecliptic(vec);
        let sLon = moonPos.lon - AYANAMSA;
        if (sLon < 0) sLon += 360;

        // Handling 360 wraparound for search is tricky if we cross 0 (Revathi -> Ashwathi).
        // If current is Revathi (27), target is 0/360.
        // Let's assume monotonic increase for the short duration?
        // Easier: Diff from target.

        // Normalize
        let diff = sLon - (targetSidereal - (360 / 27)); // Distance from *start* of current
        // actually we want when sLon >= targetSidereal

        // Let's compare raw longitude distance from target
        // We know moon moves forward.
        // If sLon < targetSidereal (and not wrapped), we need later time.

        const isPast = (sLon >= targetSidereal) || (currentNakshatraIndex === 27 && sLon < 10); // wrapped

        if (isPast) {
            max = mid;
        } else {
            min = mid;
        }
    }

    return new Date(max);
}
