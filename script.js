// Get all necessary elements from the DOM
const formContainer = document.getElementById('rentCalculationForm');
const resultText = document.getElementById('resultText');
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
    // All Rent inputs are assumed to be MONTHLY (ماهانه)
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

    // *** NEW LOGIC: Calculate the MONTHLY equivalent rent factor ***
    // The annual mortgage equivalent rent (Mortgage * EAR) is divided by 12 months.
    const monthlyRateFactor = effectiveRate / 12;

    // 1. Calculate the MONTHLY rental equivalent of the mortgage for both years
    // Monthly Rent equivalent = Mortgage * (EAR / 12)
    const lastYearMortgageRentEquivalentMonthly = lastYearMortgage * monthlyRateFactor;
    const nextYearMortgageRentEquivalentMonthly = nextYearMortgage * monthlyRateFactor;

    // 2. Calculate the "Total Rent" (Monthly) for last year
    // Total Rent Monthly = Actual Monthly Rent + Monthly Mortgage Equivalent Rent
    const lastYearTotalRentMonthly = lastYearRent + lastYearMortgageRentEquivalentMonthly;
    let nextYearTotalRentMonthly = 0;
    let finalResultHTML = ''; // Holds the final calculation result

    // Base HTML showing intermediate steps (Total Rents)
    const baseResultHTML = `
        <p>معادل اجاره‌ای رهن سال گذشته (ماهانه) ( ${effectiveRatePercent.toFixed(2)}% سالانه): 
            <strong>${formatNumber(lastYearMortgageRentEquivalentMonthly)} تومان</strong></p>
        <p><strong>اجاره کل سال گذشته (ماهانه): 
            ${formatNumber(lastYearTotalRentMonthly)} تومان</strong> (نقدی ${formatNumber(lastYearRent)} + معادل رهن)</p>
        <hr>
    `;

    // --- Check which mode to calculate: RENT or PERCENTAGE ---

    const isRentInputEntered = nextYearRentInput.length > 0;
    const isPercentInputEntered = rentIncreasePercentInput.length > 0;

    if (isRentInputEntered && isPercentInputEntered) {
        outputResult = 'خطا: لطفاً **فقط** یکی از فیلدهای "اجاره سال آینده" یا "افزایش اجاره" را وارد کنید.';
    } else if (isRentInputEntered) {
        // Case 1: Next Year Rent is entered (Calculate Rent Increase Percentage)
        // nextYearRent is the actual MONTHLY rent
        const nextYearRent = parseFloat(nextYearRentInput);

        // Calculate Next Year's Total Rent (Monthly)
        nextYearTotalRentMonthly = nextYearRent + nextYearMortgageRentEquivalentMonthly;

        // Calculate Total Rent Increase Percentage
        if (lastYearTotalRentMonthly > 0) {
            const totalRentIncreaseRatio = (nextYearTotalRentMonthly - lastYearTotalRentMonthly) / lastYearTotalRentMonthly;
            const totalRentIncreasePercent = totalRentIncreaseRatio * 100;

            finalResultHTML = `
                <p><strong>نتیجه: درصد افزایش اجاره کل: ${totalRentIncreasePercent.toFixed(2)}%</strong></p>
            `;
        } else {
            finalResultHTML = 'خطا: اجاره کل سال گذشته نمی‌تواند صفر باشد.';
        }

        outputResult = baseResultHTML + `
            <p>معادل اجاره‌ای رهن سال آینده (ماهانه): 
                <strong>${formatNumber(nextYearMortgageRentEquivalentMonthly)} تومان</strong></p>
            <p><strong>اجاره کل سال آینده (ماهانه): ${formatNumber(nextYearTotalRentMonthly)} تومان</strong></p>
            <hr>
            ${finalResultHTML}
        `;

    } else if (isPercentInputEntered) {
        // Case 2: Rent Increase Percentage is entered (Calculate Next Year Rent)
        const rentIncreasePercent = parseFloat(rentIncreasePercentInput);

        // Calculate Next Year's Total Rent (Monthly) based on the desired increase percentage
        const rentIncreaseRatio = rentIncreasePercent / 100;
        nextYearTotalRentMonthly = lastYearTotalRentMonthly * (1 + rentIncreaseRatio);

        // Calculate the Next Year's Actual Monthly Rent
        // Actual Monthly Rent = Total Monthly Rent - Next Year Monthly Mortgage Equivalent Rent
        const nextYearRent = nextYearTotalRentMonthly - nextYearMortgageRentEquivalentMonthly;

        // Check for error case (Negative Actual Rent)
        if (nextYearRent >= 0) {
            finalResultHTML = `
                <p><strong>نتیجه: اجاره نقدی ماهانه سال آینده مورد نیاز: ${formatNumber(nextYearRent)} تومان</strong></p>
            `;
        } else {
            finalResultHTML = `
                <p><strong>خطا در محاسبه:</strong> اجاره نقدی ماهانه سال آینده به ${formatNumber(nextYearRent)} تومان می‌رسد (منفی).</p>
                <p>دلیل: کاهش شدید اجاره کل (به دلیل افزایش رهن یا درصد کم افزایش).</p>
            `;
        }

        outputResult = baseResultHTML + `
            <p>معادل اجاره‌ای رهن سال آینده (ماهانه): 
                <strong>${formatNumber(nextYearMortgageRentEquivalentMonthly)} تومان</strong></p>
            <p><strong>اجاره کل سال آینده (ماهانه، با ${rentIncreasePercent.toFixed(2)}% افزایش): ${formatNumber(nextYearTotalRentMonthly)} تومان</strong></p>
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