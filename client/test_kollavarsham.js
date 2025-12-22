import { Kollavarsham } from 'kollavarsham';

const options = {
    system: 'SuryaSiddhanta',
    latitude: 9.9312,
    longitude: 76.2673
};

const kv = new Kollavarsham(options);
const date = new Date();
const output = kv.fromGregorianDate(date);
// Log specific properties to understand structure
console.log('Naksatra Object:', JSON.stringify(output.naksatra, null, 2));
console.log('Output Keys:', Object.keys(output));
console.log('Full Output (truncated):', JSON.stringify(output, null, 2).substring(0, 500));
