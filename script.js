// Get all necessary elements from the DOM
const formContainer = document.getElementById('rentCalculationForm');
const resultText = document.getElementById('resultText');
const inputFields = formContainer.querySelectorAll('input[type="text"]');

// Mapping for Persian digits to English digits
const persianDigits = {
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9'
};

/**
 * Cleans the input string by:
 * 1. Replacing Persian digits with English digits.
 * 2. Removing thousands separators (comma, Persian comma '٬').
 * 3. Replacing Persian decimal separator ('٫') with standard dot ('.').
 * 4. Ensures 'e' or 'E' remains for Exponential Notation parsing.
 * @param {string} inputString - The raw string value from the input field.
 * @returns {number} The clean numeric value.
 */
function getCleanValue(inputString) {
    if (!inputString) return 0;

    let cleanString = inputString.trim();

    // 1. Convert Persian digits to English
    for (const persian in persianDigits) {
        cleanString = cleanString.replaceAll(persian, persianDigits[persian]);
    }

    // 2. Remove thousands separators (comma and Persian separator '٬')
    cleanString = cleanString.replaceAll(',', '');
    cleanString = cleanString.replaceAll('٬', '');

    // 3. Handle Persian decimal separator '٫'
    cleanString = cleanString.replaceAll('٫', '.');

    // Convert to float (which natively handles 'e' or 'E' notation like 9e6)
    return parseFloat(cleanString) || 0;
}

/**
 * Helper function to format a number with Persian commas/digits.
 * @param {number} num - The number to format.
 * @returns {string} The formatted string.
 */
function formatNumber(num) {
    if (isNaN(num)) return '۰';
    // Use 'fa-IR' locale for Persian digits and thousand separators
    return Math.round(num).toLocaleString('fa-IR');
}

/**
 * Performs the rent calculation based on current input values.
 */
function calculateRent() {
    // --- IMPORTANT: Use getCleanValue for all inputs ---
    const lastYearRent = getCleanValue(document.getElementById('lastYearRent').value);
    const lastYearMortgage = getCleanValue(document.getElementById('lastYearMortgage').value);
    const nextYearMortgage = getCleanValue(document.getElementById('nextYearMortgage').value);
    const effectiveRatePercent = getCleanValue(document.getElementById('effectiveRate').value);

    // Raw inputs for checking calculation mode
    const nextYearRentInputRaw = document.getElementById('nextYearRent').value;
    const rentIncreasePercentInputRaw = document.getElementById('rentIncreasePercent').value;

    let outputResult = 'لطفاً مقادیر پایه (اجاره، رهن و نرخ بهره) را وارد کنید.';

    // Cleaned values for calculation mode inputs
    const nextYearRent = getCleanValue(nextYearRentInputRaw);
    const rentIncreasePercent = getCleanValue(rentIncreasePercentInputRaw);

    // --- Validation (English variable names) ---
    const isBaseInputsValid = effectiveRatePercent > 0;

    if (!isBaseInputsValid) {
        resultText.innerHTML = outputResult;
        return;
    }

    // Convert effective rate from percentage to decimal (e.g., 37 -> 0.37)
    const effectiveRate = effectiveRatePercent / 100;
    const monthlyRateFactor = effectiveRate / 12; // Monthly equivalent rate for mortgage conversion

    // 1. Calculate the MONTHLY rental equivalent of the mortgage for both years
    const lastYearMortgageRentEquivalentMonthly = lastYearMortgage * monthlyRateFactor;
    const nextYearMortgageRentEquivalentMonthly = nextYearMortgage * monthlyRateFactor;

    // 2. Calculate the "Total Rent" (Monthly) for last year
    const lastYearTotalRentMonthly = lastYearRent + lastYearMortgageRentEquivalentMonthly;
    let nextYearTotalRentMonthly = 0;
    let finalResultHTML = '';

    // Base HTML showing intermediate steps (Total Rents)
    const baseResultHTML = `
    <p>معادل اجاره‌ای رهن سال گذشته: 
      <strong>${formatNumber(lastYearMortgageRentEquivalentMonthly)}</strong></p>
    <p><strong>اجاره کل سال گذشته: 
      ${formatNumber(lastYearTotalRentMonthly)}</strong> (نقدی ${formatNumber(lastYearRent)} + معادل رهن)</p>
    <hr>
  `;

    // --- Check which mode to calculate: RENT or PERCENTAGE ---

    const isRentInputEntered = nextYearRentInputRaw.length > 0;
    const isPercentInputEntered = rentIncreasePercentInputRaw.length > 0;

    if (isRentInputEntered && isPercentInputEntered) {
        outputResult = 'خطا: لطفاً **فقط** یکی از فیلدهای "اجاره سال آینده" یا "افزایش اجاره" را وارد کنید.';
    } else if (isRentInputEntered) {
        // Case 1: Next Year Rent is entered (Calculate Rent Increase Percentage)
        nextYearTotalRentMonthly = nextYearRent + nextYearMortgageRentEquivalentMonthly;

        if (lastYearTotalRentMonthly > 0) {
            const totalRentIncreaseRatio = (nextYearTotalRentMonthly - lastYearTotalRentMonthly) / lastYearTotalRentMonthly;
            const totalRentIncreasePercent = totalRentIncreaseRatio * 100;

            finalResultHTML = `<p><strong>نتیجه: درصد افزایش اجاره کل: ${totalRentIncreasePercent.toFixed(2)}%</strong></p>`;
        } else {
            finalResultHTML = 'خطا: اجاره کل سال گذشته نمی‌تواند صفر باشد.';
        }

        outputResult = baseResultHTML + `
      <p>معادل اجاره‌ای رهن سال آینده: 
        <strong>${formatNumber(nextYearMortgageRentEquivalentMonthly)}</strong></p>
      <p><strong>اجاره کل سال آینده: ${formatNumber(nextYearTotalRentMonthly)}</strong></p>
      <hr>
      ${finalResultHTML}
    `;

    } else if (isPercentInputEntered) {
        // Case 2: Rent Increase Percentage is entered (Calculate Next Year Rent)
        const rentIncreaseRatio = rentIncreasePercent / 100;
        nextYearTotalRentMonthly = lastYearTotalRentMonthly * (1 + rentIncreaseRatio);

        const nextYearActualRent = nextYearTotalRentMonthly - nextYearMortgageRentEquivalentMonthly;

        if (nextYearActualRent >= 0) {
            finalResultHTML = `
        <p><strong>نتیجه: اجاره نقدی سال آینده مورد نیاز: ${formatNumber(nextYearActualRent)}</strong></p>
      `;
        } else {
            finalResultHTML = `
        <p><strong>خطا در محاسبه:</strong> اجاره نقدی سال آینده به ${formatNumber(nextYearActualRent)} می‌رسد (منفی).</p>
        <p>دلیل: کاهش شدید اجاره کل (به دلیل افزایش رهن یا درصد کم افزایش).</p>
      `;
        }

        outputResult = baseResultHTML + `
      <p>معادل اجاره‌ای رهن سال آینده: 
        <strong>${formatNumber(nextYearMortgageRentEquivalentMonthly)}</strong></p>
      <p><strong>اجاره کل سال آینده (با ${rentIncreasePercent.toFixed(2)}% افزایش): ${formatNumber(nextYearTotalRentMonthly)}</strong></p>
      <hr>
      ${finalResultHTML}
    `;

    } else {
        outputResult = 'لطفاً یکی از فیلدهای **اجاره سال آینده** یا **افزایش اجاره** را وارد کنید.';
    }

    // Display the result
    resultText.innerHTML = outputResult;
}

// Attach the calculateRent function to the 'input' event for all number fields
inputFields.forEach(input => {
    input.addEventListener('input', calculateRent);
});

// Run calculation once on load if any data exists
calculateRent();