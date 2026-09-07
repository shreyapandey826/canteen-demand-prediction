/* =========================================================
   CANTEENIQ — SCRIPT.JS
   Demand Prediction Frontend & ML Integration
   ========================================================= */

/* =========================================================
   API CONFIGURATION
   ========================================================= */

/* Local Flask backend */
const LOCAL_API_URL = "http://127.0.0.1:5000/predict";

/* Live Render backend */
const LIVE_API_URL = "https://canteen-demand-prediction.onrender.com/predict";

/*
   Automatically select API:
   - Localhost / 127.0.0.1: Flask local backend
   - Deployed environment: Render live backend
*/
const API_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? LOCAL_API_URL
        : LIVE_API_URL;

/* =========================================================
   DOM ELEMENTS
   ========================================================= */
const form = document.getElementById("predictionForm");
const dateInput = document.getElementById("date");
const dayOfWeek = document.getElementById("day_of_week");
const monthInput = document.getElementById("month");
const weekendStatus = document.getElementById("weekendStatus");
const weekendText = document.getElementById("weekendText");
const predictButton = document.getElementById("predictButton");
const resetButton = document.getElementById("resetButton");
const status = document.getElementById("status");
const resultEmpty = document.getElementById("resultEmpty");
const currentResult = document.getElementById("currentResult");
const predictionNumber = document.getElementById("predictionNumber");
const resultFood = document.getElementById("resultFood");
const errorBox = document.getElementById("errorBox");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const heroNumber = document.getElementById("heroNumber");
const heroFood = document.getElementById("heroFood");
const heroDate = document.getElementById("heroDate");

/* =========================================================
   DEFAULT DATE INITIALIZATION
   ========================================================= */
function setDefaultDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    if (dateInput) {
        dateInput.value = `${year}-${month}-${day}`;
        updateDateInformation();
    }
}

/* =========================================================
   DATE INFORMATION & CALCULATION LOGIC
   ========================================================= */
function updateDateInformation() {
    if (!dateInput || !dateInput.value) {
        return;
    }

    const selectedDate = new Date(dateInput.value + "T00:00:00");

    /*
        JavaScript getDay():
        Sunday = 0, Monday = 1, Tuesday = 2, Wednesday = 3,
        Thursday = 4, Friday = 5, Saturday = 6

        Trained Regression Model Encoding:
        Monday = 0, Tuesday = 1, Wednesday = 2, Thursday = 3,
        Friday = 4, Saturday = 5, Sunday = 6
    */
    const jsDay = selectedDate.getDay();
    const modelDay = jsDay === 0 ? 6 : jsDay - 1;

    if (dayOfWeek) {
        dayOfWeek.value = modelDay;
    }

    /* Month (1-12) */
    const month = selectedDate.getMonth() + 1;
    if (monthInput) {
        monthInput.value = month;
    }

    /* Weekend Detection (Saturday or Sunday) */
    const isWeekend = jsDay === 0 || jsDay === 6;

    if (weekendText && weekendStatus) {
        if (isWeekend) {
            weekendText.innerText = "Weekend";
            weekendStatus.classList.add("is-weekend");
        } else {
            weekendText.innerText = "Weekday";
            weekendStatus.classList.remove("is-weekend");
        }
    }
}

/* =========================================================
   DATE FORMATTER
   ========================================================= */
function formatDate(dateString) {
    if (!dateString) {
        return "--";
    }

    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

/* =========================================================
   FORM VALUE EXTRACTION
   ========================================================= */
function getSelectedFood() {
    const selected = document.querySelector('input[name="foodItem"]:checked');
    return selected ? selected.value : null;
}

function getRadioValue(name) {
    const selected = document.querySelector(`input[name="${name}"]:checked`);
    return selected ? Number(selected.value) : 0;
}

function getConditions() {
    const exam = getRadioValue("exam") === 1;
    const festival = getRadioValue("festival") === 1;
    const isWeekend = weekendStatus && weekendStatus.classList.contains("is-weekend");

    if (exam && festival) return "Exam + Festival";
    if (exam) return "Exam Day";
    if (festival) return "Festival";
    if (isWeekend) return "Weekend";
    return "Normal Day";
}

/* =========================================================
   PREDICTION HISTORY (LOCALSTORAGE)
   ========================================================= */
function getHistory() {
    try {
        const saved = localStorage.getItem("canteenPredictionHistory");
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error("History error:", error);
        return [];
    }
}

function saveHistory(history) {
    localStorage.setItem("canteenPredictionHistory", JSON.stringify(history));
}

function addToHistory(data) {
    let history = getHistory();
    history.unshift(data);

    /* Retain latest 4 forecasts */
    history = history.slice(0, 4);

    saveHistory(history);
    renderHistory();
}

function renderHistory() {
    if (!historyList) return;

    const history = getHistory();

    if (history.length === 0) {
        historyList.innerHTML = `
            <div class="history-empty">
                No forecasts yet.
            </div>
        `;
        return;
    }

    historyList.innerHTML = history.map((item, index) => {
        return `
            <div class="history-item">
                <div class="history-top">
                    <div class="history-food">
                        ${index + 1}. ${item.food}
                    </div>
                    <div class="history-demand">
                        ${Number(item.prediction).toFixed(2)}
                    </div>
                </div>
                <div class="history-bottom">
                    <span>${item.date}</span>
                    <span>${item.conditions}</span>
                </div>
            </div>
        `;
    }).join("");
}

/* =========================================================
   RENDER PREDICTION RESULT
   ========================================================= */
function showResult(prediction, food, date) {
    const number = Number(prediction);
    const conditions = getConditions();
    const isWeekend = weekendStatus && weekendStatus.classList.contains("is-weekend");

    /* Switch empty state to active result */
    if (resultEmpty) resultEmpty.style.display = "none";
    if (currentResult) currentResult.style.display = "block";

    /* Display main forecast values */
    if (predictionNumber) predictionNumber.innerText = number.toFixed(2);
    if (resultFood) resultFood.innerText = food;

    /* Update summary metadata */
    const summaryDateEl = document.getElementById("summaryDate");
    if (summaryDateEl) summaryDateEl.innerText = formatDate(date);

    const summaryDayEl = document.getElementById("summaryDay");
    if (summaryDayEl && dayOfWeek) {
        summaryDayEl.innerText = dayOfWeek.options[dayOfWeek.selectedIndex].text;
    }

    const summaryWeekendEl = document.getElementById("summaryWeekend");
    if (summaryWeekendEl) {
        summaryWeekendEl.innerText = isWeekend ? "Weekend" : "Weekday";
    }

    const summaryConditionsEl = document.getElementById("summaryConditions");
    if (summaryConditionsEl) summaryConditionsEl.innerText = conditions;

    /* Update Hero Demand Snapshot card */
    if (heroNumber) heroNumber.innerText = number.toFixed(1);
    if (heroFood) heroFood.innerText = food;
    if (heroDate) heroDate.innerText = formatDate(date);
}

/* =========================================================
   EVENT LISTENERS
   ========================================================= */

/* Reset Button */
if (resetButton) {
    resetButton.addEventListener("click", function () {
        if (form) form.reset();
        setDefaultDate();

        /* Reset result panel */
        if (resultEmpty) resultEmpty.style.display = "grid";
        if (currentResult) currentResult.style.display = "none";

        /* Reset error message */
        if (errorBox) {
            errorBox.style.display = "none";
            errorBox.innerText = "";
        }

        /* Reset status badge */
        if (status) {
            status.innerText = "WAITING";
            status.className = "result-status";
        }

        /* Reset hero snapshot */
        if (heroNumber) heroNumber.innerText = "--";
        if (heroFood) heroFood.innerText = "Awaiting prediction";
        if (heroDate) heroDate.innerText = "Select inputs below";
    });
}

/* Clear History Button */
if (clearHistoryButton) {
    clearHistoryButton.addEventListener("click", function () {
        if (getHistory().length === 0) return;

        if (confirm("Clear recent forecasts?")) {
            localStorage.removeItem("canteenPredictionHistory");
            renderHistory();
        }
    });
}

/* Date Change Event */
if (dateInput) {
    dateInput.addEventListener("change", updateDateInformation);
}

/* Form Submit Event */
if (form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        /* 1. Food selection check */
        const selectedFood = getSelectedFood();
        if (!selectedFood) {
            alert("Please select a food item.");
            return;
        }

        /* 2. Date check */
        if (!dateInput.value) {
            alert("Please select a date.");
            return;
        }

        /* 3. API configuration check */
        if (!API_URL) {
            if (errorBox) {
                errorBox.style.display = "block";
                errorBox.innerText = "Backend API URL is not configured.";
            }
            if (status) {
                status.innerText = "API NOT SET";
                status.className = "result-status";
            }
            return;
        }

        /* =================================================
           ONE-HOT ENCODING (EXACT MODEL SPECIFICATION)
        ================================================= */
        let item_Biryani = 0;
        let item_Chai = 0;
        let item_Dosa = 0;
        let item_Samosa = 0;
        let item_Sandwich = 0;

        if (selectedFood === "Biryani") item_Biryani = 1;
        if (selectedFood === "Chai") item_Chai = 1;
        if (selectedFood === "Dosa") item_Dosa = 1;
        if (selectedFood === "Samosa") item_Samosa = 1;
        if (selectedFood === "Sandwich") item_Sandwich = 1;

        /* Weekend calculation for model payload */
        const selectedDate = new Date(dateInput.value + "T00:00:00");
        const jsDay = selectedDate.getDay();
        const selectedWeekend = (jsDay === 0 || jsDay === 6) ? 1 : 0;

        /* Numeric inputs */
        const temperature = Number(document.getElementById("temperature").value);
        const rainfall = Number(document.getElementById("rainfall").value);
        const rolling_avg = Number(document.getElementById("rolling_avg").value);

        /* Model Request Payload */
        const data = {
            is_weekend: selectedWeekend,
            is_exam: getRadioValue("exam"),
            is_festival: getRadioValue("festival"),
            temperature: temperature,
            rainfall: rainfall,
            day_of_week: Number(dayOfWeek.value),
            month: Number(monthInput.value),
            rolling_avg: rolling_avg,
            item_Biryani: item_Biryani,
            item_Chai: item_Chai,
            item_Dosa: item_Dosa,
            item_Samosa: item_Samosa,
            item_Sandwich: item_Sandwich
        };

        console.log("Prediction payload:", data);

        /* UI Loading State */
        predictButton.disabled = true;
        predictButton.innerText = "Generating forecast...";
        status.innerText = "PROCESSING";
        status.className = "result-status";
        if (errorBox) {
            errorBox.style.display = "none";
            errorBox.innerText = "";
        }

        /* API Call */
        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            /* Read as text first to handle non-JSON error pages safely */
            const responseText = await response.text();
            console.log("Backend response:", responseText);

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                throw new Error("Backend returned an invalid response. Check your Flask/Render API.");
            }

            if (!response.ok) {
                throw new Error(result.error || result.message || "Prediction request failed.");
            }

            if (result.prediction === undefined || result.prediction === null) {
                throw new Error("Prediction value was not returned by the backend.");
            }

            /* Display Result */
            showResult(result.prediction, selectedFood, dateInput.value);

            /* Save to History */
            addToHistory({
                prediction: Number(result.prediction),
                food: selectedFood,
                date: formatDate(dateInput.value),
                conditions: getConditions(),
                timestamp: new Date().toISOString()
            });

            /* Success State */
            status.innerText = "COMPLETED";
            status.className = "result-status success";

        } catch (error) {
            console.error("Prediction Error:", error);

            if (errorBox) {
                errorBox.style.display = "block";
                errorBox.innerText = "Unable to generate forecast. " + error.message;
            }

            status.innerText = "ERROR";
            status.className = "result-status";
        } finally {
            predictButton.disabled = false;
            predictButton.innerText = "Generate Forecast →";
        }
    });
}

/* =========================================================
   INITIALIZATION
   ========================================================= */
setDefaultDate();
renderHistory();

console.log("CanteenIQ frontend initialized.");
console.log("API URL:", API_URL);

/* About Page Marker */
document.addEventListener("DOMContentLoaded", function () {
    const currentPage = window.location.pathname.split("/").pop();
    if (currentPage === "about.html") {
        document.body.classList.add("about-page-loaded");
    }
});