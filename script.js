// Get all necessary elements from the DOM
const form = document.getElementById('rentCalculationForm');
const resultText = document.getElementById('resultText');

// Conversion constant: Mortgage amount equivalent to 1 unit of annual rent
// In Iranian system, this is usually 300,000 Tomans per 1,000,000 Tomans of rent, but
// here we use the given effective rate to calculate the equivalent rent for the mortgage.
// The effective annual rate (EAR) is used directly for conversion.

// Event listener for form submission
form.addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent default form submission

    // Get input values (values are converted to numbers)
    // Variables are named in English as requested
    const lastYearRent = parseFloat(document.getElementById('lastYearRent').value);
    const lastYearMortgage = parseFloat(document.getElementById('lastYearMortgage').value);
    const nextYearMortgage = parseFloat(document.getElementById('nextYearMortgage').value);

    // Effective Annual Rate (EAR) in percentage (e.g., 20)
    const effectiveRatePercent = parseFloat(document.getElementById('effectiveRate').value);

    // Calculation mode inputs
    const nextYearRentInput = document.getElementById('nextYearRent').value;
    const rentIncreasePercentInput = document.getElementById('rentIncreasePercent').value;

    // Convert effective rate from percentage to decimal (e.g., 20 -> 0.20)
    const effectiveRate = effectiveRatePercent / 100; // effectiveRate: EAR in decimal

    // --- Core Calculation Logic ---

    // 1. Calculate the rental equivalent of the mortgage for both years
    // The equivalent rent is calculated by: Mortgage * EAR
    const lastYearMortgageRentEquivalent = lastYearMortgage * effectiveRate;
    const nextYearMortgageRentEquivalent = nextYearMortgage * effectiveRate;

    // 2. Calculate the "Total Rent" for each year (Actual Rent + Mortgage Equivalent Rent)
    const lastYearTotalRent = lastYearRent + lastYearMortgageRentEquivalent;
    let nextYearTotalRent = 0; // Will be calculated based on input mode

    let outputResult = ''; // Holds the final result message

    // --- Check which mode to calculate: RENT or PERCENTAGE ---

    // Case 1: Next Year Rent is entered (Calculate Rent Increase Percentage)
    if (nextYearRentInput && !rentIncreasePercentInput) {
        const nextYearRent = parseFloat(nextYearRentInput);

        // Calculate Next Year's Total Rent using the entered Next Year Rent
        nextYearTotalRent = nextYearRent + nextYearMortgageRentEquivalent;

        // Calculate Total Rent Increase Percentage
        if (lastYearTotalRent > 0) {
            const totalRentIncreaseRatio = (nextYearTotalRent - lastYearTotalRent) / lastYearTotalRent;
            const totalRentIncreasePercent = totalRentIncreaseRatio * 100; // in percentage

            outputResult = `
                <p>اجاره کل سال گذشته (شامل معادل رهن): ${formatNumber(lastYearTotalRent)} تومان</p>
                <p>اجاره کل سال آینده (شامل معادل رهن): ${formatNumber(nextYearTotalRent)} تومان</p>
                <hr>
                <p><strong>درصد افزایش اجاره کل: ${totalRentIncreasePercent.toFixed(2)}%</strong></p>
            `;
        } else {
            outputResult = 'خطا: اجاره کل سال گذشته نمی‌تواند صفر باشد.';
        }

        // Case 2: Rent Increase Percentage is entered (Calculate Next Year Rent)
    } else if (rentIncreasePercentInput && !nextYearRentInput) {
        const rentIncreasePercent = parseFloat(rentIncreasePercentInput);

        // Calculate Next Year's Total Rent based on the desired increase percentage
        const rentIncreaseRatio = rentIncreasePercent / 100;
        nextYearTotalRent = lastYearTotalRent * (1 + rentIncreaseRatio);

        // Calculate the Next Year's Actual Rent
        // Actual Rent = Total Rent - Next Year Mortgage Equivalent Rent
        const nextYearRent = nextYearTotalRent - nextYearMortgageRentEquivalent;

        // Check for valid result (e.g., actual rent should not be negative)
        if (nextYearRent >= 0) {
            outputResult = `
                <p>اجاره کل سال گذشته (شامل معادل رهن): ${formatNumber(lastYearTotalRent)} تومان</p>
                <p>اجاره کل سال آینده (شامل معادل رهن): ${formatNumber(nextYearTotalRent)} تومان</p>
                <hr>
                <p><strong>اجاره سال آینده مورد نیاز: ${formatNumber(nextYearRent)} تومان</strong></p>
            `;
        } else {
            outputResult = 'خطا در محاسبه: اجاره سال آینده منفی می‌شود. شاید افزایش رهن بیش از حد زیاد است.';
        }

        // Error Case
    } else {
        outputResult = 'لطفاً **فقط** یکی از فیلدهای "اجاره سال آینده" یا "افزایش اجاره" را وارد کنید.';
    }

    // Display the result
    resultText.innerHTML = outputResult;
});

/**
 * Helper function to format a number with commas for better readability.
 * @param {number} num - The number to format.
 * @returns {string} The formatted string.
 */
function formatNumber(num) {
    if (isNaN(num)) return '۰';
    // Format number with locale 'fa' for Persian digits and thousand separators
    return num.toLocaleString('fa-IR');
}