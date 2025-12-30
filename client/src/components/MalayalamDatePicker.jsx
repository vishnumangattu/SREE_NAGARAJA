import React, { useState, useMemo } from 'react';
import { Kollavarsham } from 'kollavarsham';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { nakshatraList } from '../utils/constants';
import { calculatePanchangData } from '../utils/panchang';

// Helper to normalize strings for comparison
const normalize = (str) => String(str).toLowerCase().replace(/[^a-z]/g, "");

const tithiList = [
    { id: 1, ml: "പ്രഥമ", en: "Prathama" },
    { id: 2, ml: "ദ്വിതീയ", en: "Dwitiya" },
    { id: 3, ml: "തൃതീയ", en: "Tritiya" },
    { id: 4, ml: "ചതുർത്ഥി", en: "Chaturthi" },
    { id: 5, ml: "പഞ്ചമി", en: "Panchami" },
    { id: 6, ml: "ഷഷ്ടി", en: "Shashti" },
    { id: 7, ml: "സപ്തമി", en: "Saptami" },
    { id: 8, ml: "അഷ്ടമി", en: "Ashtami" },
    { id: 9, ml: "നവമി", en: "Navami" },
    { id: 10, ml: "ദശമി", en: "Dashami" },
    { id: 11, ml: "ഏകാദശി", en: "Ekadashi" },
    { id: 12, ml: "ദ്വാദശി", en: "Dwadashi" },
    { id: 13, ml: "ത്രയോദശി", en: "Trayodashi" },
    { id: 14, ml: "ചതുർദ്ദശി", en: "Chaturdashi" },
    { id: 15, ml: "പൗർണ്ണമി", en: "Pournami" }, // or Amavasi based on paksha, but simplified mapping here
    { id: 16, ml: "പ്രഥമ", en: "Prathama" },
    { id: 17, ml: "ദ്വിതീയ", en: "Dwitiya" },
    { id: 18, ml: "തൃതീയ", en: "Tritiya" },
    { id: 19, ml: "ചതുർത്ഥി", en: "Chaturthi" },
    { id: 20, ml: "പഞ്ചമി", en: "Panchami" },
    { id: 21, ml: "ഷഷ്ടി", en: "Shashti" },
    { id: 22, ml: "സപ്തമി", en: "Saptami" },
    { id: 23, ml: "അഷ്ടമി", en: "Ashtami" },
    { id: 24, ml: "നവമി", en: "Navami" },
    { id: 25, ml: "ദശമി", en: "Dashami" },
    { id: 26, ml: "ഏകാദശി", en: "Ekadashi" },
    { id: 27, ml: "ദ്വാദശി", en: "Dwadashi" },
    { id: 28, ml: "ത്രയോദശി", en: "Trayodashi" },
    { id: 29, ml: "ചതുർദ്ദശി", en: "Chaturdashi" },
    { id: 30, ml: "അമാവാസി", en: "Amavasi" }
];

const malayalamWeekdays = ["ഞായർ", "തിങ്കൾ", "ചൊവ്വ", "ബുധൻ", "വ്യാഴം", "വെള്ളി", "ശനി"];

const MalayalamDatePicker = ({ value, onChange, min, max, onClose }) => {
    // Initialize with the passed value or today
    const initialDate = value ? new Date(value) : new Date();
    const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
    const [hoveredDay, setHoveredDay] = useState(null);

    // Memoize calendar generation for performance
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

        const kv = new Kollavarsham({ system: 'SuryaSiddhanta', latitude: 9.9312, longitude: 76.2673 });

        const days = [];
        // Pad empty slots for start of month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month, d);
            let malayalamData = null;
            let starName = '';
            let starNazhika = '';
            let tithiName = '';
            let tithiNazhika = '';

            try {
                const output = kv.fromGregorianDate(date);
                malayalamData = output;

                // Simple star for fallback
                const calculatedStar = output?.naksatra?.enMalayalam;
                const matchedStar = nakshatraList.find(n => normalize(n.en) === normalize(calculatedStar));
                starName = matchedStar ? matchedStar.ml : calculatedStar;

                // Advanced Panchang Data (Using external utility)
                // This calculates Tithi & Nakshatra end times in Nazhika
                const panchang = calculatePanchangData(date);
                // console.log("Panchang Data for", date, panchang); // DEBUG LOG

                if (panchang) {
                    // Update Star Name ...
                    if (panchang.nakshatra.name) {
                        // Map english nakshatra to malayalam if possible
                        const pStar = nakshatraList.find(n => normalize(n.en) === normalize(panchang.nakshatra.name));
                        starName = pStar ? pStar.ml : panchang.nakshatra.name;
                    }
                    starNazhika = panchang.nakshatra.nazhika;

                    // Tithi
                    const pTithi = tithiList.find(t => normalize(t.en) === normalize(panchang.tithi.name));
                    tithiName = pTithi ? pTithi.ml : panchang.tithi.name;
                    tithiNazhika = panchang.tithi.nazhika;
                }

            } catch (e) {
                console.error("Error generating date", e);
            }

            days.push({
                date,
                day: d,
                malayalamData,
                starName,
                starNazhika,
                tithiName,
                tithiNazhika,
                iso: date.toISOString().split('T')[0]
            });
        }

        return days;
    }, [currentMonth]);

    // Header Info
    const getMalayalamHeaderInfo = () => {
        // Get the first and last day of the current view to show the range
        // e.g. "Vrischikam - Dhanu 1201"
        if (calendarDays.length === 0) return "";

        // Find first valid day
        const firstValid = calendarDays.find(d => d);
        // Find last valid day
        const lastValid = [...calendarDays].reverse().find(d => d);

        if (!firstValid || !lastValid) return "";

        const startMonth = firstValid.malayalamData?.mlMasaName;
        const endMonth = lastValid.malayalamData?.mlMasaName;
        const year = firstValid.malayalamData?.year;

        if (startMonth === endMonth) {
            return `${startMonth} ${year}`;
        }
        return `${startMonth} - ${endMonth} ${year}`;
    };

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        if (!day) return;
        onChange(day.iso);
        setSelectedDate(day.date);
        if (onClose) onClose();
    };

    const isToday = (date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const isSelected = (date) => {
        if (!selectedDate) return false;
        return date.getDate() === selectedDate.getDate() &&
            date.getMonth() === selectedDate.getMonth() &&
            date.getFullYear() === selectedDate.getFullYear();
    };

    const MONTH_NAMES = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const styles = {
        container: {
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: '1px solid #d1d5db',
            overflow: 'hidden',
            width: '480px', // Wider
            maxWidth: '95vw',
            fontFamily: '"Noto Sans Malayalam", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
        headerBox: {
            background: '#546e7a', // Slate/Blue-gray like the image
            color: 'white',
            padding: '12px',
            textAlign: 'center',
            position: 'relative',
        },
        headerEnglish: {
            fontSize: '18px',
            fontWeight: 'bold',
            display: 'block',
        },
        headerMalayalam: {
            fontSize: '14px',
            fontWeight: '500',
            opacity: 0.9,
            marginTop: '4px',
            display: 'block',
        },
        navBtnLeft: {
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'white',
            borderRadius: '50%',
            padding: '4px',
            cursor: 'pointer',
            color: '#546e7a',
            border: 'none',
        },
        navBtnRight: {
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'white',
            borderRadius: '50%',
            padding: '4px',
            cursor: 'pointer',
            color: '#546e7a',
            border: 'none',
        },
        weekdaysRow: {
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            textAlign: 'center',
            backgroundColor: '#fff',
            borderBottom: '1px solid #e0e0e0',
        },
        weekday: {
            padding: '8px 0',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#000',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            backgroundColor: '#fff',
        },
        dayCell: {
            position: 'relative',
            height: '85px',
            borderRight: '1px solid #e0e0e0',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: 'white',
            cursor: 'pointer',
            transition: 'background 0.1s',
        },
        // Using absolute positioning for layout like the image
        tithiText: {
            position: 'absolute',
            top: '4px',
            left: '4px',
            fontSize: '9px',
            color: '#424242',
            fontWeight: '500',
            maxWidth: '60%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        dateMalayalam: {
            position: 'absolute',
            top: '4px',
            right: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: '#d32f2f', // Red
        },
        dateEnglish: {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#000',
        },
        nakshatraText: {
            position: 'absolute',
            bottom: '4px',
            left: '4px',
            fontSize: '9px',
            color: '#00695c', // Teal/Greenish
            fontWeight: '600',
            width: '90%',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },

        // Selection State
        selectedCell: {
            backgroundColor: '#fff3e0', // Light Orange/Yellow bg
            boxShadow: 'inset 0 0 0 2px #ff9800',
        },
        todayMarker: {
            border: '1px solid #2196f3',
        },
        tithiDuration: {
            marginLeft: '2px',
            opacity: 0.8,
            fontSize: '8px'
        },
        nakshatraDuration: {
            display: 'block',
            fontSize: '8px',
            lineHeight: '1.1',
            opacity: 0.8,
            marginTop: '1px'
        }
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.headerBox}>
                <button type="button" onClick={handlePrevMonth} style={styles.navBtnLeft}>
                    <ChevronLeft size={18} />
                </button>

                <span style={styles.headerEnglish}>
                    {MONTH_NAMES[currentMonth.getMonth()]} - {currentMonth.getFullYear()}
                </span>
                <span style={styles.headerMalayalam}>
                    {getMalayalamHeaderInfo()}
                </span>

                <button type="button" onClick={handleNextMonth} style={styles.navBtnRight}>
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Weekdays */}
            <div style={styles.weekdaysRow}>
                {malayalamWeekdays.map(d => (
                    <div key={d} style={styles.weekday}>{d}</div>
                ))}
            </div>

            {/* Grid */}
            <div style={styles.grid}>
                {calendarDays.map((day, idx) => {
                    const isLastCol = (idx + 1) % 7 === 0;
                    if (!day) return <div key={`empty-${idx}`} style={{ ...styles.dayCell, borderRight: isLastCol ? 'none' : styles.dayCell.borderRight }} />;

                    const isSel = isSelected(day.date);
                    const isTdy = isToday(day.date);

                    let cellStyle = {
                        ...styles.dayCell,
                        borderRight: isLastCol ? 'none' : styles.dayCell.borderRight
                    };

                    if (isSel) {
                        cellStyle = { ...cellStyle, ...styles.selectedCell };
                    } else if (isTdy) {
                        cellStyle = { ...cellStyle, ...styles.todayMarker };
                    }

                    return (
                        <div
                            key={day.iso}
                            style={cellStyle}
                            onClick={() => handleDateClick(day)}
                            onMouseEnter={(e) => {
                                if (!isSel) e.currentTarget.style.backgroundColor = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                                if (!isSel) e.currentTarget.style.backgroundColor = 'white';
                            }}
                        >
                            {/* Top Left: Tithi */}
                            <div style={styles.tithiText}>
                                {day.tithiName}
                                {day.tithiNazhika && <span style={styles.tithiDuration}>{day.tithiNazhika}</span>}
                            </div>

                            {/* Top Right: Malayalam Date */}
                            <span style={styles.dateMalayalam}>
                                {day.malayalamData?.date}
                            </span>

                            {/* Center: English Date */}
                            <span style={styles.dateEnglish}>
                                {day.day}
                            </span>

                            {/* Bottom Left: Nakshatra */}
                            <div style={styles.nakshatraText}>
                                {day.starName}
                                {day.starNazhika && <span style={styles.nakshatraDuration}>{day.starNazhika}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Simple Footer */}
            {selectedDate && (
                <div style={{ padding: '8px', fontSize: '12px', borderTop: '1px solid #ddd', background: '#f9f9f9', textAlign: 'center' }}>
                    Selected: <b>{selectedDate.toLocaleDateString('en-GB')}</b>
                </div>
            )}
        </div>
    );
};

export default MalayalamDatePicker;
