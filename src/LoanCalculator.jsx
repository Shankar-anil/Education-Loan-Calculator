import React, { useState, useEffect, useRef } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LabelList,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaRupeeSign } from "react-icons/fa";

export default function LoanCalculator() {
  const [fees, setFees] = useState(["250000", "350000", "350000", "350000"]);
  const [rate, setRate] = useState(10);
  const [years, setYears] = useState(10);
  const [result, setResult] = useState(null);
  const [sameFor3Years, setSameFor3Years] = useState(false);
  const [sameFor4Years, setSameFor4Years] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  const summaryRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    calculateLoan();
  }, []);

  const handleFeeChange = (index, value) => {
    const updated = [...fees];
    updated[index] = value;
    setFees(updated);
  };

  const applySameFees = (type) => {
    const base = fees[0] || "";
    const updated = [...fees];
    if (type === 3) {
      for (let i = 1; i < 3; i++) updated[i] = base;
      setSameFor3Years(true);
    } else if (type === 4) {
      for (let i = 1; i < 4; i++) updated[i] = base;
      setSameFor4Years(true);
    }
    setFees(updated);
  };

  const clearAll = () => {
    setFees(["", "", "", ""]);
    setRate(10);
    setYears(10);
    setResult(null);
    setSameFor3Years(false);
    setSameFor4Years(false);
  };

  const calculateLoan = () => {
    const interestRate = rate / 100;
    const filteredFees = fees.filter((fee) => parseFloat(fee) > 0);
    const courseDuration = filteredFees.length;

    let totalPrincipal = 0;
    let totalInterestDuringStudy = 0;
    let loanTracker = [];

    filteredFees.forEach((fee, i) => {
      const p = parseFloat(fee || 0);
      totalPrincipal += p;
      loanTracker.push({ year: i, amount: p });
    });

    for (let i = 0; i < loanTracker.length; i++) {
      const yearRemaining = courseDuration - i;
      totalInterestDuringStudy += loanTracker[i].amount * interestRate * yearRemaining;
    }

    const totalLoan = totalPrincipal + totalInterestDuringStudy;
    const n = years * 12;
    const r = interestRate / 12;
    const emi = (totalLoan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalRepayment = emi * n;
    const totalEMIInterest = totalRepayment - totalLoan;
    const totalInterest = totalInterestDuringStudy + totalEMIInterest;

    setResult({
      totalPrincipal,
      totalInterestDuringStudy,
      totalLoan,
      emi,
      totalRepayment,
      totalInterest,
      totalEMIInterest,
    });

    setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const downloadPDF = () => {
    const input = document.getElementById("summary");
    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("loan-summary.pdf");
    });
  };

  const chartData = result
    ? [
        { name: "Fees", value: result.totalPrincipal },
        { name: "Study Interest", value: result.totalInterestDuringStudy },
        { name: "EMI Interest", value: result.totalEMIInterest },
      ]
    : [];

  const COLORS = ["#4f46e5", "#16a34a", "#f97316"];
  const currencyFormatter = (value) => `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 shadow-2xl space-y-6 text-gray-800 dark:text-gray-100">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">🔢 Education Loan Calculator</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="text-sm px-3 py-1 rounded border dark:border-gray-600"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fees.map((fee, i) => (
            <div className="relative" key={i}>
              <label className="block text-sm mb-1">
                {`${i + 1}${['st', 'nd', 'rd', 'th'][i]} Year Fee`}
              </label>
              <input
                type="number"
                className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                placeholder={`Enter Year ${i + 1} Fee`}
                value={fee}
                onChange={(e) => handleFeeChange(i, e.target.value)}
              />
              <FaRupeeSign className="absolute left-3 top-10 text-gray-400 dark:text-gray-500" />
            </div>
          ))}
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={sameFor3Years} onChange={() => applySameFees(3)} />
            Same for 3 years
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={sameFor4Years} onChange={() => applySameFees(4)} />
            Same for 4 years
          </label>
          <button onClick={clearAll} className="ml-auto px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            🗑️ Clear All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
          <input
            type="number"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            placeholder="e.g., 10%"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Repayment Duration (Years)</label>
          <input
            type="number"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            placeholder="e.g., 10"
            value={years}
            onChange={(e) => setYears(parseInt(e.target.value))}
          />
        </div>
        <button
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition self-end"
          onClick={calculateLoan}
        >
          📊 Calculate Loan Details
        </button>
      </div>

      {result && (
        <div id="summary" ref={summaryRef} className="space-y-4">
          <h3 className="text-xl font-semibold">📋 Loan Summary</h3>
          <table className="w-full border dark:border-gray-600 text-sm">
            <tbody>
              <tr><td className="font-medium">Total Fees</td><td className="text-blue-600">{currencyFormatter (result.totalPrincipal)}</td></tr>
              <tr><td>Interest During Study</td><td className="text-green-600">{currencyFormatter (result.totalInterestDuringStudy)}</td></tr>
              <tr><td>Total Loan Before EMI</td><td className="text-yellow-600">{currencyFormatter (result.totalLoan)}</td></tr>
              <tr><td>Monthly EMI</td><td className="text-red-600">{currencyFormatter (result.emi)}</td></tr>
              <tr><td>Total Repayment Amount</td><td className="text-purple-600">{currencyFormatter (result.totalRepayment)}</td></tr>
              <tr><td>Total EMI Interest</td><td className="text-orange-600">{currencyFormatter (result.totalEMIInterest)}</td></tr>
              <tr><td><strong>Total Interest Paid</strong></td><td className="text-pink-600 font-bold">{currencyFormatter (result.totalInterest)}</td></tr>
            </tbody>
          </table>
          <button onClick={downloadPDF} className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">💾 Download as PDF</button>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                labelLine={false}
              >
                <LabelList dataKey="value" position="inside" formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => currencyFormatter(value)} />
              <Legend iconType="circle" verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
