import { Kollavarsham } from 'kollavarsham';

const options = { system: 'SuryaSiddhanta', latitude: 9.9312, longitude: 76.2673 };
const kv = new Kollavarsham(options);

let date = new Date();
const stars = new Set();
// Loop for 40 days to cover all 27 stars
for (let i = 0; i < 40; i++) {
    const output = kv.fromGregorianDate(date);
    if (output.naksatra) {
        stars.add(JSON.stringify({
            en: output.naksatra.enMalayalam,
            ml: output.naksatra.mlMalayalam
        }));
    }
    date.setDate(date.getDate() + 1);
}

console.log([...stars]);
