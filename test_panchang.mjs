import { calculatePanchangData } from './client/src/utils/panchang.js';

const date = new Date();
console.log("Date:", date);
const data = calculatePanchangData(date);
console.log("Result:", JSON.stringify(data, null, 2));
