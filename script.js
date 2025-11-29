// Get all necessary elements from the DOM
const formContainer = document.getElementById('rentCalculationForm');
const resultText = document.getElementById('resultText');
// Select all number inputs for real-time calculation
const inputFields = formContainer.querySelectorAll('input[type="number"]');

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
    // Get raw input values
    const lastYearRent = parseFloat(document.getElementById('lastYearRent').value) || 0;
    const lastYearMortgage = parseFloat(document.getElementById('lastYearMortgage').value) || 0;
    const nextYearMortgage = parseFloat(document.getElementById('nextYearMortgage').value) || 0;
    const effectiveRatePercent = parseFloat(document.getElementById('effectiveRate').value);

    const nextYearRentInput = document.getElementById('nextYearRent').value;
    const rentIncreasePercentInput = document.getElementById('rentIncreasePercent').value;

    let outputResult = 'لطفاً مقادیر پایه (اجاره، رهن و نرخ بهره) را وارد کنید.';

    // --- Validation (English variable names) ---
    const isBaseInputsValid = !isNaN(effectiveRatePercent) && effectiveRatePercent >= 0;

    if (!isBaseInputsValid) {
        resultText.innerHTML = outputResult;
        return; // Stop calculation if base inputs are invalid
    }

    // Convert effective rate from percentage to decimal (e.g., 37 -> 0.37)
    const effectiveRate = effectiveRatePercent / 100;

    // 1. Calculate the rental equivalent of the mortgage for both years
    // Rent equivalent = Mortgage * EAR
    const lastYearMortgageRentEquivalent = lastYearMortgage * effectiveRate;
    const nextYearMortgageRentEquivalent = nextYearMortgage * effectiveRate;

    // 2. Calculate the "Total Rent" for last year
    const lastYearTotalRent = lastYearRent + lastYearMortgageRentEquivalent;
    let nextYearTotalRent = 0;
    let finalResultHTML = ''; // Holds the final calculation result

    // Base HTML showing intermediate steps (Total Rents)
    const baseResultHTML = `
        <p>معادل اجاره‌ای رهن سال گذشته ( ${effectiveRatePercent.toFixed(2)}% از ${formatNumber(lastYearMortgage)}): 
            <strong>${formatNumber(lastYearMortgageRentEquivalent)} تومان</strong></p>
        <p><strong>اجاره کل سال گذشته: 
            ${formatNumber(lastYearTotalRent)} تومان</strong> (نقدی ${formatNumber(lastYearRent)} + معادل رهن)</p>
        <hr>
    `;

    // --- Check which mode to calculate: RENT or PERCENTAGE ---

    // Check if both or neither secondary inputs are entered
    const isRentInputEntered = nextYearRentInput.length > 0;
    const isPercentInputEntered = rentIncreasePercentInput.length > 0;

    if (isRentInputEntered && isPercentInputEntered) {
        outputResult = 'خطا: لطفاً **فقط** یکی از فیلدهای "اجاره سال آینده" یا "افزایش اجاره" را وارد کنید.';
    } else if (isRentInputEntered) {
        // Case 1: Next Year Rent is entered (Calculate Rent Increase Percentage)
        const nextYearRent = parseFloat(nextYearRentInput);

        // Calculate Next Year's Total Rent
        nextYearTotalRent = nextYearRent + nextYearMortgageRentEquivalent;

        // Calculate Total Rent Increase Percentage
        if (lastYearTotalRent > 0) {
            const totalRentIncreaseRatio = (nextYearTotalRent - lastYearTotalRent) / lastYearTotalRent;
            const totalRentIncreasePercent = totalRentIncreaseRatio * 100;

            finalResultHTML = `
                <p><strong>نتیجه: درصد افزایش اجاره کل: ${totalRentIncreasePercent.toFixed(2)}%</strong></p>
            `;
        } else {
            finalResultHTML = 'خطا: اجاره کل سال گذشته نمی‌تواند صفر باشد.';
        }

        outputResult = baseResultHTML + `
            <p>معادل اجاره‌ای رهن سال آینده ( ${effectiveRatePercent.toFixed(2)}% از ${formatNumber(nextYearMortgage)}): 
                <strong>${formatNumber(nextYearMortgageRentEquivalent)} تومان</strong></p>
            <p><strong>اجاره کل سال آینده: ${formatNumber(nextYearTotalRent)} تومان</strong></p>
            <hr>
            ${finalResultHTML}
        `;

    } else if (isPercentInputEntered) {
        // Case 2: Rent Increase Percentage is entered (Calculate Next Year Rent)
        const rentIncreasePercent = parseFloat(rentIncreasePercentInput);

        // Calculate Next Year's Total Rent based on the desired increase percentage
        const rentIncreaseRatio = rentIncreasePercent / 100;
        nextYearTotalRent = lastYearTotalRent * (1 + rentIncreaseRatio);

        // Calculate the Next Year's Actual Rent
        const nextYearRent = nextYearTotalRent - nextYearMortgageRentEquivalent;

        // Check for error case (as you experienced)
        if (nextYearRent >= 0) {
            finalResultHTML = `
                <p><strong>نتیجه: اجاره نقدی سال آینده مورد نیاز: ${formatNumber(nextYearRent)} تومان</strong></p>
            `;
        } else {
            finalResultHTML = `
                <p><strong>خطا در محاسبه:</strong> اجاره نقدی سال آینده به ${formatNumber(nextYearRent)} تومان می‌رسد (منفی).</p>
                <p>دلیل: افزایش رهن ( ${formatNumber(nextYearMortgage - lastYearMortgage)} تومان) بیش از حد زیاد است یا درصد افزایش کل کم است.</p>
            `;
        }

        outputResult = baseResultHTML + `
            <p>معادل اجاره‌ای رهن سال آینده ( ${effectiveRatePercent.toFixed(2)}% از ${formatNumber(nextYearMortgage)}): 
                <strong>${formatNumber(nextYearMortgageRentEquivalent)} تومان</strong></p>
            <p><strong>اجاره کل سال آینده (با ${rentIncreasePercent.toFixed(2)}% افزایش): ${formatNumber(nextYearTotalRent)} تومان</strong></p>
            <hr>
            ${finalResultHTML}
        `;

    } else {
        // Neither secondary input is entered
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