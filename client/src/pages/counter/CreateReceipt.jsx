import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
// import "./temple.css";
import { Save, Printer, Plus, Trash2 } from "lucide-react";
import { nakshatraList } from "../../utils/constants";
import { Kollavarsham } from 'kollavarsham';
import TransliterationInput from "../../components/TransliterationInput";

// Helper to normalize strings for comparison
const MIN_DATE = new Date().toISOString().split("T")[0];
const MAX_DATE = "2026-12-31";

function TempleCounter() {
  // Statics
  // Statics

  const [items, setItems] = useState([]);
  const [vazhipadItems, setVazhipadItems] = useState([]);
  const [locked, setLocked] = useState(false);
  const vazhipaduRef = useRef(null);
  const countRef = useRef(null);
  const nameRef = useRef(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(null);

  const [formData, setFormData] = useState({
    receiptNo: "Auto",
    date: new Date().toISOString().split("T")[0],
    paymentType: "Cash",
    vazhipadu: "",
    vazhipaduType: "",
    count: "",
    rate: "",
    amount: "",
    name: "",
    nakshatram: "",
    nakshatramType: "",
    mode: "One Day",
  });

  const [postingData, setPostingData] = useState({
    address: "",
    pincode: "",
    phone: ""
  });

  const [recurringDate, setRecurringDate] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    dayOfWeek: "0", // 0 = Sunday
    monthlyMode: "English", // 'English' or 'Malayalam'
    englishDay: "1",
    malayalamStar: "",
    manualDates: [] // For Malayalam mode
  });

  // Fetch Vazhipads on Mount
  useEffect(() => {
    fetchVazhipads();
  }, []);

  const fetchVazhipads = async () => {
    try {
      const { data } = await api.get('/vazhipads');
      setVazhipadItems(data);
    } catch (error) {
      console.error("Failed to fetch vazhipads", error);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        submitHandler(e);
      }
      if (e.key === "F3") {
        e.preventDefault();
        submitHandler(e, true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items, formData]); // Add dependencies for handler access

  const focusNext = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const form = e.target.form;
    if (!form) return;
    const elems = Array.from(form.elements);
    const isFocusable = (el) => el && !el.disabled && el.type !== 'hidden' && el.tabIndex !== -1 && !el.readOnly;
    let idx = elems.indexOf(e.target);
    const total = elems.length;
    for (let i = 1; i <= total; i++) {
      const next = elems[(idx + i) % total];
      if (isFocusable(next)) {
        next.focus();
        break;
      }
    }
  };

  const handlePrint = () => window.print();

  const handleVazhipaduChange = (e) => {
    if (locked) return;
    const value = e.target.value.toLowerCase();
    const match = vazhipadItems.find((item) => item.code.toLowerCase().startsWith(value));

    setFormData((prev) => ({
      ...prev,
      vazhipadu: value,
      vazhipaduType: match ? match.name : "",
      rate: match ? match.rate : "",
      // Amount handled by useEffect
    }));
  };

  const handleNakshatramChange = (e) => {
    const raw = e.target.value;
    // Update raw input immediately
    setFormData((prev) => ({ ...prev, nakshatram: raw }));

    const value = String(raw).toLowerCase().trim();
    if (!value) {
      setFormData((prev) => ({ ...prev, nakshatramType: "" }));
      return;
    }
    const match = nakshatraList.find(
      (item) =>
        item.en.toLowerCase().startsWith(value) || item.ml.toLowerCase().startsWith(value)
    );

    // Update the type (Malayalam) if match found, but don't force-change the English input yet
    setFormData((prev) => ({
      ...prev,
      nakshatramType: match ? match.ml : "",
    }));
  };

  const finalizeNakshatram = () => {
    const val = formData.nakshatram || "";
    const value = String(val).toLowerCase().trim();
    if (!value) {
      setFormData((prev) => ({ ...prev, nakshatramType: "" }));
      return;
    }
    const match = nakshatraList.find(
      (item) =>
        item.en.toLowerCase() === value ||
        item.en.toLowerCase().startsWith(value) ||
        item.ml.toLowerCase() === value ||
        item.ml.toLowerCase().startsWith(value)
    );
    if (match) {
      setFormData((prev) => ({
        ...prev,
        nakshatram: match.en,
        nakshatramType: match.ml,
      }));
    }
  };


  const handleCount = (e) => {
    const count = e.target.value;
    setFormData((prev) => ({
      ...prev,
      count,
      // Amount is now handled by useEffect
    }));
  };

  const addPerson = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.vazhipadu) {
      alert("Please select/enter Vazhipadu first");
      return;
    }
    const count = Number(formData.count) || 1;
    const rate = Number(formData.rate) || 0;
    // Multiplier extracted for record if needed, but amount is in formData
    const amount = Number(formData.amount); // Already calculated by useEffect

    const person = {
      name: formData.name,
      nakshatram: formData.nakshatramType || formData.nakshatram,
      count,
      rate,
      amount
    };


    setItems((prev) => [...prev, person]);
    setLocked(true);
    setFormData((prev) => ({ ...prev, name: "", nakshatram: "", count: "" }));
    setTimeout(() => nameRef.current?.focus(), 0);
  };

  const removePerson = (index) => {
    setItems((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      if (copy.length === 0) setLocked(false);
      return copy;
    });
  };


  // Helper to calculate recurring dates based on mode
  const calculateRecurringDates = () => {
    if (formData.mode === 'Every Week') {
      if (!recurringDate.startDate || !recurringDate.endDate) return [];
      const start = new Date(recurringDate.startDate);
      const end = new Date(recurringDate.endDate);
      const targetDay = parseInt(recurringDate.dayOfWeek);
      const dates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === targetDay) dates.push(new Date(d).toISOString().split("T")[0]);
      }
      return dates.length > 0 ? dates : [formData.date];
    }
    else if (formData.mode === 'Everyday') {
      if (!recurringDate.startDate || !recurringDate.endDate) return [];
      const start = new Date(recurringDate.startDate);
      const end = new Date(recurringDate.endDate);
      const dates = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d).toISOString().split("T")[0]);
      }
      return dates.length > 0 ? dates : [formData.date];
    }
    else if (formData.mode === 'Once a Month') {
      if (recurringDate.monthlyMode === 'English') {
        if (!recurringDate.startDate || !recurringDate.endDate) return [];
        const start = new Date(recurringDate.startDate);
        const end = new Date(recurringDate.endDate);
        const targetDay = parseInt(recurringDate.englishDay);
        const dates = [];
        let current = new Date(start);
        current.setDate(targetDay);
        if (current < start) current.setMonth(current.getMonth() + 1);
        while (current <= end) {
          if (current.getDate() === targetDay) dates.push(new Date(current).toISOString().split("T")[0]);
          current.setMonth(current.getMonth() + 1);
          current.setDate(targetDay);
        }
        return dates.length > 0 ? dates : [];
      } else {
        // Malayalam (Manual)
        return recurringDate.manualDates.length > 0 ? recurringDate.manualDates : [];
      }
    }
    return [formData.date];
  };

  const [isGenerating, setIsGenerating] = useState(false);

  const generateAutoDates = async () => {
    // Input Validation
    if (!recurringDate.malayalamStar) {
      alert("Please select a Birth Star first.");
      return;
    }
    if (!recurringDate.startDate || !recurringDate.endDate) {
      alert("Please select Start and End months.");
      return;
    }

    setIsGenerating(true);

    // Use setTimeout to allow UI to show loading state
    setTimeout(() => {
      try {
        const start = new Date(recurringDate.startDate);
        const end = new Date(recurringDate.endDate); // This is usually "Month", need to cover full month
        // Adjust end date to ensure we cover the full end month
        const actualEnd = new Date(new Date(end).getFullYear(), new Date(end).getMonth() + 1, 0);

        const options = { system: 'SuryaSiddhanta', latitude: 9.9312, longitude: 76.2673 }; // Default Kerala
        const kv = new Kollavarsham(options);

        const newDates = [];
        const selectedStar = nakshatraList.find(n => n.ml === recurringDate.malayalamStar);
        if (!selectedStar) {
          alert("Invalid Star Selected");
          setIsGenerating(false);
          return;
        }

        // Loop through each day
        let current = new Date(start);
        while (current <= actualEnd) {
          const output = kv.fromGregorianDate(current);
          // Check matches (Compare English names normalized)
          // output.naksatra.enMalayalam vs selectedStar.en
          const calculatedStarName = output?.naksatra?.enMalayalam;

          if (calculatedStarName && normalize(calculatedStarName) === normalize(selectedStar.en)) {
            newDates.push(new Date(current).toISOString().split("T")[0]);
          }

          current.setDate(current.getDate() + 1);
        }

        if (newDates.length > 0) {
          // Merge with existing, avoid duplicates
          setRecurringDate(prev => {
            const combined = new Set([...prev.manualDates, ...newDates]);
            return { ...prev, manualDates: Array.from(combined).sort() };
          });
          alert(`Generated ${newDates.length} dates for ${recurringDate.malayalamStar}. You can edit them below.`);
        } else {
          alert(`No dates found for ${recurringDate.malayalamStar} in this range.`);
        }

      } catch (err) {
        console.error("Auto generation failed", err);
        alert("Failed to calculate dates. Please try manual selection.");
      } finally {
        setIsGenerating(false);
      }
    }, 100);
  };

  const getDateMultiplier = () => {
    // If mode is one day, multiplier is 1
    if (formData.mode === 'One Day') return 1;
    // Otherwise calculate number of dates
    return calculateRecurringDates().length;
  };

  // Update amount whenever count, rate, mode, or recurring dates change
  useEffect(() => {
    const multiplier = getDateMultiplier();
    const count = Number(formData.count) || 0; // default to 0 to avoid NaN/Empty
    const rate = Number(formData.rate) || 0;

    // Only update if we have a rate (meaning a vazhipadu is selected)
    if (rate > 0 && formData.count !== "") {
      setFormData(prev => ({
        ...prev,
        amount: count * rate * multiplier
      }));
    }
  }, [formData.count, formData.rate, formData.mode, recurringDate, formData.date]);

  const handleSave = async (itemsToSave, shouldPrint = false) => {
    const finalDates = calculateRecurringDates();

    const payload = {
      vazhipadu: formData.vazhipadu,
      vazhipaduType: formData.vazhipaduType,
      vazhipaddate: finalDates, // Send array
      currentdate: new Date().toISOString().split("T")[0],
      paymentType: formData.paymentType,
      mode: formData.mode,
      items: itemsToSave,
      postingDetails: formData.vazhipadu.toLowerCase().includes('np') ? postingData : null
    };

    try {
      const { data } = await api.post("/receipts", payload);

      if (shouldPrint) {
        setFormData(prev => ({ ...prev, receiptNo: data.receiptNumber }));
        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for render
        window.print();
      }

      alert(`Saved Successfully! Receipt #${data.receiptNumber} for ${calculateRecurringDates().length} dates.`);
      // Reset for next receipt
      setItems([]);
      setLocked(false);
      setRecurringDate(prev => ({ ...prev, manualDates: [] })); // Reset manual dates
      setFormData((prev) => ({
        ...prev,
        vazhipadu: "",
        vazhipaduType: "",
        count: "",
        rate: "",
        amount: "",
        name: "",
        nakshatram: "",
        nakshatramType: "",
        receiptNo: "Auto"
      }));
      setPostingData({
        address: "",
        pincode: "",
        phone: ""
      });
    } catch (error) {
      console.error(error);
      alert(
        "Error saving data: " + (error.response?.data?.message || error.message)
      );
    }
  };

  const submitHandler = async (e, shouldPrint = false) => {
    if (e && e.preventDefault) e.preventDefault();

    // Determine current vazhipad object for checking flags
    const currentVazhipad = vazhipadItems.find(v =>
      v.name === formData.vazhipaduType ||
      v.code.toLowerCase() === formData.vazhipadu.toLowerCase() ||
      v.name.toLowerCase() === formData.vazhipadu.toLowerCase()
    );

    const requiresConfirmation = currentVazhipad?.requiresDateConfirmation;

    if (items.length > 0) {
      if (requiresConfirmation) {
        setPendingSubmission({ items, shouldPrint });
        setShowConfirmModal(true);
      } else {
        await handleSave(items, shouldPrint);
      }
    } else {
      if (formData.name && formData.vazhipadu) {
        const count = Number(formData.count) || 1;
        const rate = Number(formData.rate) || 0;
        const item = {
          name: formData.name,
          nakshatram: formData.nakshatramType || formData.nakshatram,
          count: count,
          rate: rate,
          amount: count * rate,
        };

        if (requiresConfirmation) {
          setPendingSubmission({ items: [item], shouldPrint });
          setShowConfirmModal(true);
        } else {
          await handleSave([item], shouldPrint);
        }
      } else {
        alert("Please fill details (Vazhipadu & Name)");
      }
    }
  };

  const confirmDateAndSave = async () => {
    setShowConfirmModal(false);
    if (pendingSubmission) {
      await handleSave(pendingSubmission.items, pendingSubmission.shouldPrint);
      setPendingSubmission(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      {/* Header / Top Bar */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--primary-color)" }}
          >
            Temple Counter
          </h1>
        </div>
        <div className="flex gap-4 items-center bg-white p-2 rounded-lg border border-gray-200" style={{ gap: '40px' }}>
          <div className="px-4 border-r border-gray-200 ">
            <span className="block text-xs text-muted uppercase">
              Receipt No
            </span>
            <span className="block text-xl font-mono font-bold">
              #{formData.receiptNo}
            </span>
          </div>
          <div className="px-4">
            <span className="block text-xs text-muted uppercase">Date</span>
            <span className="block text-xl font-bold">
              {new Date(formData.date).toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-auto-fit gap-6">
        {/* Left Column: Input Form */}
        <div className="card lg:col-span-2">
          <form>
            {/* Section 1: Vazhipadu Details */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <h3 className="text-sm font-semibold uppercase text-secondary mb-4 flex items-center gap-2">
                <span className="dot-primary"></span>
                Vazhipadu Details
              </h3>
              <div
                className="grid"
                style={{ gridTemplateColumns: "1fr 1fr", gap: "1rem" }}
              >
                {/* Row 1 */}
                <div style={{ gridColumn: "span 2" }}>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Vazhipadu Name (Eng)
                  </label>
                  <input
                    ref={vazhipaduRef}
                    type="text"
                    value={formData.vazhipadu}
                    onChange={handleVazhipaduChange}
                    onKeyDown={focusNext}
                    disabled={locked}
                    className="w-full"
                    placeholder="Type to search..."
                    autoFocus
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Type (Mal)
                  </label>
                  <input
                    type="text"
                    value={formData.vazhipaduType}
                    onKeyDown={focusNext}
                    readOnly
                    className="bg-gray-50 text-gray-500"
                    tabIndex="-1"
                  />
                </div>
                {/* Mode Selection */}
                <div className="form-group" style={{ gridColumn: formData.mode === 'One Day' ? "span 1" : "span 2" }}>
                  <label>Mode</label>
                  <select
                    value={formData.mode}
                    onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                    onKeyDown={focusNext}
                    className={`w-full p-2 border rounded ${locked ? 'bg-gray-100' : ''}`}
                    disabled={locked}
                  >
                    <option>One Day</option>
                    <option>Everyday</option>
                    <option>Every Week</option>
                    <option>Once a Month</option>
                  </select>
                </div>

                {/* Date Selection Logic */}
                <div className="form-group" style={{ gridColumn: formData.mode === 'One Day' ? "span 1" : "span 2" }}>
                  <label>Date{formData.mode !== 'One Day' ? ' Range' : ''}</label>

                  <label>Date{formData.mode !== 'One Day' ? ' Range' : ''}</label>

                  {formData.mode === 'Everyday' ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <span className="text-xs text-gray-500">Start Date</span>
                          <input
                            type="date"
                            value={recurringDate.startDate}
                            onChange={(e) => setRecurringDate({ ...recurringDate, startDate: e.target.value })}
                            className={`w-full p-2 border rounded ${locked ? 'bg-gray-100' : ''}`}
                            disabled={locked}
                            min={MIN_DATE}
                            max={MAX_DATE}
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-gray-500">End Date</span>
                          <input
                            type="date"
                            value={recurringDate.endDate}
                            onChange={(e) => setRecurringDate({ ...recurringDate, endDate: e.target.value })}
                            className={`w-full p-2 border rounded ${locked ? 'bg-gray-100' : ''}`}
                            disabled={locked}
                            min={MIN_DATE}
                            max={MAX_DATE}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-blue-600 font-medium">
                        Total Days: {calculateRecurringDates().length}
                      </div>
                    </div>
                  ) : formData.mode === 'Every Week' ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <span className="text-xs text-gray-500">Start</span>
                          <input
                            type="date"
                            value={recurringDate.startDate}
                            onChange={(e) => setRecurringDate({ ...recurringDate, startDate: e.target.value })}
                            className={`w-full p-2 border rounded ${locked ? 'bg-gray-100' : ''}`}
                            disabled={locked}
                            min={MIN_DATE}
                            max={MAX_DATE}
                          />
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-gray-500">End</span>
                          <input
                            type="date"
                            value={recurringDate.endDate}
                            onChange={(e) => setRecurringDate({ ...recurringDate, endDate: e.target.value })}
                            className={`w-full p-2 border rounded ${locked ? 'bg-gray-100' : ''}`}
                            disabled={locked}
                            min={MIN_DATE}
                            max={MAX_DATE}
                          />
                        </div>
                      </div>
                      <select
                        value={recurringDate.dayOfWeek}
                        onChange={(e) => setRecurringDate({ ...recurringDate, dayOfWeek: e.target.value })}
                        className={`w-full p-2 border rounded ${locked ? 'bg-gray-100' : ''}`}
                        disabled={locked}
                      >
                        <option value="0">Sunday</option>
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                      </select>
                      <div className="text-xs text-blue-600 font-medium">
                        Total Days: {calculateRecurringDates().length}
                      </div>
                    </div>
                  ) : formData.mode === 'Once a Month' ? (
                    <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      {/* Sub Mode Selection - Segmented Control Style */}
                      <div className="flex p-1 bg-white rounded-lg border border-gray-200 mb-2">
                        <label
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium cursor-pointer transition-all ${recurringDate.monthlyMode === 'English' ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100' : 'text-gray-500 hover:bg-gray-50'}`}
                          onClick={() => setRecurringDate({ ...recurringDate, monthlyMode: 'English' })}
                        >
                          <input
                            type="radio"
                            name="monthlyMode"
                            checked={recurringDate.monthlyMode === 'English'}
                            onChange={() => { }} // Handled by parent onClick
                            className="hidden"
                            disabled={locked}
                          />
                          📅 English Date
                        </label>
                        <div className="w-px bg-gray-200 my-1"></div>
                        <label
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium cursor-pointer transition-all ${recurringDate.monthlyMode === 'Malayalam' ? 'bg-orange-50 text-orange-700 shadow-sm border border-orange-100' : 'text-gray-500 hover:bg-gray-50'}`}
                          onClick={() => setRecurringDate({ ...recurringDate, monthlyMode: 'Malayalam' })}
                        >
                          <input
                            type="radio"
                            name="monthlyMode"
                            checked={recurringDate.monthlyMode === 'Malayalam'}
                            onChange={() => { }} // Handled by parent onClick
                            className="hidden"
                            disabled={locked}
                          />
                          ⭐ Malayalam Star
                        </label>
                      </div>

                      {recurringDate.monthlyMode === 'English' ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="block text-xs font-semibold text-gray-500 mb-1">Start Month</span>
                              <input
                                type="date"
                                value={recurringDate.startDate}
                                onChange={(e) => setRecurringDate({ ...recurringDate, startDate: e.target.value })}
                                className={`w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${locked ? 'bg-gray-100' : 'bg-white'}`}
                                disabled={locked}
                                min={MIN_DATE}
                                max={MAX_DATE}
                              />
                            </div>
                            <div>
                              <span className="block text-xs font-semibold text-gray-500 mb-1">End Month</span>
                              <input
                                type="date"
                                value={recurringDate.endDate}
                                onChange={(e) => setRecurringDate({ ...recurringDate, endDate: e.target.value })}
                                className={`w-full p-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all ${locked ? 'bg-gray-100' : 'bg-white'}`}
                                disabled={locked}
                                min={MIN_DATE}
                                max={MAX_DATE}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-600">Day:</span>
                              <select
                                value={recurringDate.englishDay}
                                onChange={(e) => setRecurringDate({ ...recurringDate, englishDay: e.target.value })}
                                className={`p-2 w-20 border border-gray-200 rounded-md bg-gray-50 font-bold text-gray-800 focus:outline-none focus:border-orange-500 ${locked ? 'opacity-50' : ''}`}
                                disabled={locked}
                              >
                                {[...Array(31)].map((_, i) => (
                                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                              </select>
                            </div>
                            <div className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                              Total: {calculateRecurringDates().length} Days
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          {/* Malayalam Star Mode */}
                          <div className="flex flex-col gap-4">
                            {/* Auto Fill Section */}
                            <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                              <span className="block text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Auto-Fill Settings</span>
                              <div className="grid grid-cols-2 gap-3 mb-3">
                                <div>
                                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">From</span>
                                  <input
                                    type="date"
                                    value={recurringDate.startDate}
                                    onChange={(e) => setRecurringDate({ ...recurringDate, startDate: e.target.value })}
                                    className="w-full p-2 border border-gray-200 rounded text-sm font-medium text-gray-700"
                                    disabled={locked}
                                  />
                                </div>
                                <div>
                                  <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1">To</span>
                                  <input
                                    type="date"
                                    value={recurringDate.endDate}
                                    onChange={(e) => setRecurringDate({ ...recurringDate, endDate: e.target.value })}
                                    className="w-full p-2 border border-gray-200 rounded text-sm font-medium text-gray-700"
                                    disabled={locked}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <select
                                  value={recurringDate.malayalamStar}
                                  onChange={(e) => setRecurringDate({ ...recurringDate, malayalamStar: e.target.value })}
                                  className="flex-1 p-2 border border-gray-200 rounded text-sm font-medium text-gray-800 focus:border-orange-500 outline-none"
                                  disabled={locked}
                                >
                                  <option value="">Select Birth Star...</option>
                                  {nakshatraList.map((n) => (
                                    <option key={n.en} value={n.ml}>{n.ml} ({n.en})</option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={generateAutoDates}
                                  disabled={isGenerating || locked}
                                  className="px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded shadow-sm hover:bg-orange-700 active:scale-95 transition-all flex items-center gap-2"
                                >
                                  {isGenerating ? '...' : '⚡ Fill'}
                                </button>
                              </div>
                            </div>

                            {/* Manual Add / List Section */}
                            <div className="border border-gray-200 rounded-lg bg-white flex flex-col">
                              <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-400 uppercase">Selected Dates</span>
                                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                  {recurringDate.manualDates?.length || 0}
                                </span>
                              </div>

                              <div className="p-2 border-b border-gray-100">
                                <div className="flex gap-2">
                                  <input
                                    type="date"
                                    id="manualDateInput"
                                    className="flex-1 p-2 border border-gray-200 rounded text-sm focus:border-orange-500 outline-none"
                                    disabled={locked}
                                    min={MIN_DATE}
                                    max={MAX_DATE}
                                  />
                                  <button
                                    type="button"
                                    className="bg-gray-800 text-white px-3 py-2 rounded text-sm font-bold hover:bg-black transition-colors"
                                    onClick={() => {
                                      const input = document.getElementById('manualDateInput');
                                      const val = input.value;
                                      if (val && !recurringDate.manualDates.includes(new Date(val).toISOString())) {
                                        setRecurringDate(prev => ({
                                          ...prev,
                                          manualDates: [...prev.manualDates, new Date(val).toISOString()].sort()
                                        }));
                                        input.value = '';
                                      }
                                    }}
                                    disabled={locked}
                                  >
                                    <Plus size={16} />
                                  </button>
                                </div>
                              </div>

                              <div className="max-h-40 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                                {recurringDate.manualDates?.length === 0 ? (
                                  <div className="text-center py-4 text-gray-400 text-xs italic">
                                    No dates added yet. Use Auto-Fill or Add Manually.
                                  </div>
                                ) : (
                                  recurringDate.manualDates?.map((d, index) => (
                                    <div key={index} className="flex justify-between items-center text-sm p-1.5 hover:bg-gray-50 rounded group">
                                      <span className="text-gray-700 font-medium">
                                        {new Date(d).toLocaleDateString("en-GB")}
                                        <span className="text-gray-400 ml-1 font-normal text-xs">
                                          ({new Date(d).toLocaleDateString("en-US", { weekday: 'short' })})
                                        </span>
                                      </span>
                                      {!locked && (
                                        <button
                                          type="button"
                                          onClick={() => setRecurringDate(prev => ({ ...prev, manualDates: prev.manualDates.filter((_, i) => i !== index) }))}
                                          className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        className={`w-full p-2 border rounded ${locked ? 'bg-gray-100' : ''} cursor-pointer`}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        onKeyDown={focusNext}
                        disabled={locked}
                        min={MIN_DATE}
                        max={MAX_DATE}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Posting Details for 'NP' Code */}
            {formData.vazhipadu.toLowerCase().includes('np') && (
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h3 className="text-sm font-semibold uppercase text-secondary mb-4 flex items-center gap-2">
                  <span className="dot-primary"></span>
                  Postal Details (Optional)
                </h3>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">
                        Phone Number
                      </label>
                      <input
                        type="number"
                        value={postingData.phone}
                        onChange={(e) => setPostingData({ ...postingData, phone: e.target.value })}
                        placeholder="Contact Number"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-secondary mb-1">
                        Pincode
                      </label>
                      <input
                        type="number"
                        value={postingData.pincode}
                        onChange={(e) => setPostingData({ ...postingData, pincode: e.target.value })}
                        placeholder="6XXXXX"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-secondary mb-1">
                      Address
                    </label>
                    <TransliterationInput
                      value={postingData.address}
                      onChange={(val) => setPostingData({ ...postingData, address: val })}
                      placeholder="Postal Address (Use toggle for Malayalam)"
                      className="w-full p-2 border rounded"
                      multiline={true}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div style={{ gridColumn: "span 3", marginTop: '20px' }}>
                  <label className="block text-xs font-semibold text-secondary mb-1 ">
                    Name
                  </label>
                  <TransliterationInput
                    value={formData.name}
                    onChange={(val) =>
                      setFormData({ ...formData, name: val })
                    }
                    onKeyDown={focusNext}
                    placeholder="Devotee Name (Type in English -> Malayalam)"
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Nakshatram (Eng)
                  </label>
                  <input
                    type="text"
                    value={formData.nakshatram}
                    onChange={handleNakshatramChange}
                    onBlur={finalizeNakshatram}
                    onKeyDown={focusNext}
                    placeholder="Search..."
                    className="w-full"
                  />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Star (Mal)
                  </label>
                  <input
                    type="text"
                    value={formData.nakshatramType}
                    onKeyDown={focusNext}
                    readOnly
                    className="bg-gray-50 text-gray-500"
                    tabIndex="-1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Count
                  </label>
                  <input
                    ref={countRef}
                    type="number"
                    value={formData.count}
                    onChange={handleCount}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addPerson(e);
                      } else {
                        focusNext(e);
                      }
                    }}
                    className="w-full font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Rate
                  </label>
                  <input
                    type="text"
                    value={formData.rate}
                    onKeyDown={focusNext}
                    readOnly
                    className="bg-gray-50 text-gray-500"
                    tabIndex="-1"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-secondary mb-1">
                    Amount
                  </label>
                  <input
                    type="text"
                    value={formData.amount}
                    onKeyDown={focusNext}
                    readOnly
                    className="bg-gray-50 font-bold"
                    tabIndex="-1"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={addPerson}
              className="btn-secondary w-full justify-center py-3 border-dashed border-2 hover:border-orange-500 hover:text-orange-500 transition-colors"
              style={{
                color: "var(--primary-color)",
                marginTop: "30px",
                borderColor: "var(--primary-color)",
              }}
            >
              <Plus size={18} /> Add Person to List
            </button>
          </form>
        </div>

        {/* Right Column: Receipt Summary & Actions */}
        <div className="flex flex-col h-full gap-6 w">
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              border: "1px solid #f3f4f6",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              height: "100%",
              width: "100%",
            }}
          >
            {/* Header */}
            <div
              style={{
                background: "linear-gradient(to right, #fff7ed, #ffffff)",
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid #fed7aa",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ea580c' // Orange-600
                }}></div>
                <h3 style={{
                  fontSize: "1.1rem",
                  fontWeight: "700",
                  color: "#1f2937", // Gray-800
                  margin: 0
                }}>
                  Current Receipt
                </h3>
                <span style={{
                  backgroundColor: '#ffedd5', // Orange-100
                  color: '#9a3412', // Orange-800
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  marginLeft: '0.5rem'
                }}>
                  {items.length} Items
                </span>
              </div>

              {items.length > 0 && (
                <button
                  onClick={() => {
                    setItems([]);
                    setLocked(false);
                  }}
                  style={{
                    fontSize: "0.85rem",
                    color: "#ef4444",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    textDecoration: "none",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  <Trash2 size={14} /> Clear All
                </button>
              )}
            </div>

            {/* List Area */}
            <div
              style={{
                flexGrow: 1,
                overflowY: "auto",
                padding: "0",
                maxHeight: "calc(100vh - 400px)", // Dynamic height
                scrollbarWidth: 'thin',
                backgroundColor: "#fff"
              }}
            >
              {items.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "4rem 2rem",
                  color: "#9ca3af",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%"
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#fff7ed',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    color: '#fdba74'
                  }}>
                    <Plus size={32} />
                  </div>
                  <p style={{ margin: 0, fontWeight: "500" }}>Receipt is empty</p>
                  <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                    Fill in the details on the left and <br /> press <strong>Enter</strong> or click <strong>Add</strong>.
                  </p>
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead style={{
                    backgroundColor: "#f9fafb",
                    position: "sticky",
                    top: 0,
                    zIndex: 10
                  }}>
                    <tr>
                      <th style={{
                        padding: "0.75rem 1.5rem",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        color: "#6b7280",
                        letterSpacing: "0.05em",
                        borderBottom: "1px solid #f3f4f6"
                      }}>Name / Offering</th>
                      <th style={{
                        padding: "0.75rem",
                        textAlign: "center",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        color: "#6b7280",
                        letterSpacing: "0.05em",
                        borderBottom: "1px solid #f3f4f6"
                      }}>Star</th>
                      <th style={{
                        padding: "0.75rem 1.5rem",
                        textAlign: "right",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        color: "#6b7280",
                        letterSpacing: "0.05em",
                        borderBottom: "1px solid #f3f4f6"
                      }}>Amount</th>
                      <th style={{
                        padding: "0.75rem",
                        borderBottom: "1px solid #f3f4f6",
                        width: "40px"
                      }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid #f9fafb",
                        }}
                      >
                        <td style={{ padding: "1rem 1.5rem", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: "600", color: "#374151", fontSize: "0.95rem" }}>
                            {item.name}
                          </div>
                          <div style={{
                            fontSize: "0.8rem",
                            color: "#f97316", // Orange-500
                            marginTop: "2px",
                            display: "inline-block",
                            background: "#fff7ed",
                            padding: "1px 6px",
                            borderRadius: "4px"
                          }}>
                            {formData.vazhipaduType}
                          </div>
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center", verticalAlign: "middle", color: "#4b5563" }}>
                          {item.nakshatram || "-"}
                        </td>
                        <td style={{
                          padding: "0.75rem 1.5rem",
                          textAlign: "right",
                          verticalAlign: "middle",
                          fontFamily: "monospace",
                          fontSize: "1rem",
                          fontWeight: "700",
                          color: "#1f2937"
                        }}>
                          ₹{item.amount}
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "center", verticalAlign: "middle" }}>
                          <button
                            onClick={() => removePerson(idx)}
                            style={{
                              background: "#fee2e2",
                              border: "none",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "background 0.2s"
                            }}
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer / Summary */}
            <div style={{
              backgroundColor: "#ffffff",
              borderTop: "2px dashed #e5e7eb",
              padding: "1.5rem",
              boxShadow: "0 -4px 6px -1px rgba(0,0,0,0.02)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "1.5rem" }}>
                <div>
                  <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "0.25rem" }}>Total Amount</div>
                  <div style={{
                    fontSize: "2rem",
                    fontWeight: "800",
                    color: "var(--primary-color)",
                    lineHeight: 1
                  }}>
                    ₹{" "}
                    {items.reduce(
                      (acc, i) => acc + (Number(i.amount) || 0),
                      formData.name && formData.vazhipadu && !items.length
                        ? Number(formData.amount) || 0
                        : 0
                    )}
                  </div>
                </div>
                <div style={{ width: "160px" }}>
                  <label style={{ fontSize: "0.75rem", fontWeight: "600", color: "#374151", marginBottom: "4px", display: "block" }}>
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) =>
                      setFormData({ ...formData, paymentType: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "0.5rem",
                      borderColor: "#d1d5db",
                      fontSize: "0.9rem",
                      backgroundColor: "#f9fafb"
                    }}
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="UPI">📱 UPI / GPay</option>
                    <option value="MoneyOrder">📮 Money Order</option>
                    <option value="OnlineTransaction">🌐 Online Transaction</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  onClick={handlePrint}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.875rem",
                    borderRadius: "0.75rem",
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    color: "#374151",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                  }}
                >
                  <Printer size={18} /> Print (F3)
                </button>
                <button
                  onClick={submitHandler}
                  style={{
                    flex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    padding: "0.875rem",
                    borderRadius: "0.75rem",
                    border: "none",
                    backgroundColor: "var(--primary-color)",
                    color: "#ffffff",
                    fontWeight: "600",
                    fontSize: "1rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 6px -1px rgba(234, 88, 12, 0.3), 0 2px 4px -1px rgba(234, 88, 12, 0.15)", // Orange shadow
                    transition: "transform 0.1s"
                  }}
                >
                  <Save size={20} /> Save (F2)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Print Area */}
      <div id="print-area">
        <div className="bill-container">
          <h2 className="bill-title">Temple Receipt</h2>
          <div className="bill-header">
            <div>No: {formData.receiptNo}</div>
            <div>Date: {new Date().toLocaleDateString("en-GB")}</div>
          </div>
          <div className="bill-header" style={{ marginBottom: "10px" }}>
            <div>Item: {formData.vazhipaduType || formData.vazhipadu}</div>
            <div>Vazhipad Date: {new Date(formData.date).toLocaleDateString("en-GB")}</div>
          </div>

          <table className="bill-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Star</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {(items.length > 0
                ? items
                : formData.name
                  ? [
                    {
                      name: formData.name,
                      nakshatram:
                        formData.nakshatramType || formData.nakshatram,
                      count: formData.count,
                      amount: formData.amount,
                    },
                  ]
                  : []
              ).map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>{item.nakshatram}</td>
                  <td>{item.count}</td>
                  <td>{item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="total">
            <strong>
              Total: ₹{" "}
              {items.length > 0
                ? items.reduce((acc, i) => acc + (Number(i.amount) || 0), 0)
                : formData.amount || 0}
            </strong>
          </div>
          <div className="thank-you">
            <p>Om Namah Shivaya</p>
          </div>
        </div>
      </div>
      {/* Confirmation Modal */}
      {/* Confirmation Modal */}
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(5px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '360px',
              padding: '2rem',
              margin: '1rem',
              border: 'none',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <div style={{ marginBottom: '1rem', fontSize: '2.5rem' }}>📅</div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#1f2937' }}>Confirm Date</h3>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Please verify the date below before saving the receipt.
            </p>

            {/* Date Box */}
            <div style={{
              width: '100%',
              backgroundColor: '#fff7ed',
              border: '1px solid #ffedd5',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1.5rem',
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 'bold', color: '#ea580c', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                Selected Date
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
                {new Date(formData.date).toLocaleDateString("en-GB", {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={confirmDateAndSave}
                className="btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.75rem',
                  fontSize: '1rem'
                }}
              >
                Yes, Confirm and Save
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  document.querySelector('input[type="date"]')?.focus();
                }}
                className="btn-secondary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.75rem',
                  fontSize: '1rem'
                }}
              >
                Change Date
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}



export default TempleCounter;
