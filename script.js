// ==========================================
// 1. KONFIGURASI SENSOR
// ==========================================

// Ambang ini hanya untuk demonstrasi.
// Bukan standar keselamatan atau ambang erupsi.

const sensorConfig = {

    SO2: {
        warning: 2,
        danger: 5,
        weight: 1.2
    },

    H2S: {
        warning: 5,
        danger: 10,
        weight: 1.2
    },

    CO2: {
        warning: 1000,
        danger: 5000,
        weight: 1
    },

    Temp: {
        warning: 50,
        danger: 100,
        weight: 1.5
    }

};


// ==========================================
// 2. PENYIMPANAN DATA
// ==========================================

let historyData = [];

try {

    historyData = JSON.parse(
        localStorage.getItem("volcanoHistory")
    ) || [];

    if (!Array.isArray(historyData)) {
        historyData = [];
    }

} catch (error) {

    historyData = [];

}


// ==========================================
// 3. DATA SENSOR
// ==========================================

let sensorData = {

    SO2: 0.5,
    H2S: 1.2,
    CO2: 450,
    Temp: 30

};


// ==========================================
// 4. RANDOM VALUE
// ==========================================

function randomValue(min, max) {

    return Math.random() * (max - min) + min;

}


// ==========================================
// 5. GENERATE DATA DUMMY
// ==========================================

function generateDummy(condition = "random") {

    if (condition === "normal") {

        sensorData = {

            SO2: randomValue(0.2, 1.5),

            H2S: randomValue(0.2, 3),

            CO2: randomValue(350, 800),

            Temp: randomValue(25, 40)

        };

    }

    else if (condition === "warning") {

        sensorData = {

            SO2: randomValue(2.5, 4.5),

            H2S: randomValue(6, 9),

            CO2: randomValue(1500, 4000),

            Temp: randomValue(55, 85)

        };

    }

    else if (condition === "danger") {

        sensorData = {

            SO2: randomValue(5.5, 8),

            H2S: randomValue(11, 15),

            CO2: randomValue(5500, 8000),

            Temp: randomValue(105, 150)

        };

    }

    else {

        const chance = Math.random();

        if (chance < 0.10) {

            generateDummy("danger");
            return;

        }

        else if (chance < 0.30) {

            generateDummy("warning");
            return;

        }

        else {

            generateDummy("normal");
            return;

        }

    }

    updateDashboard();

}


// ==========================================
// 6. FUZZY MEMBERSHIP
// ==========================================

function membership(value, warning, danger) {

    let severity =
        (value - warning) / (danger - warning);

    severity = Math.max(0, Math.min(1, severity));

    const normal = 1 - severity;

    const warningMembership =
        1 - Math.abs((2 * severity) - 1);

    const dangerMembership = severity;

    return {

        normal,

        warning: Math.max(0, warningMembership),

        danger: dangerMembership

    };

}


// ==========================================
// 7. FUZZY LOGIC
// ==========================================

function fuzzyLogic(data) {

    let totalScore = 0;

    let totalWeight = 0;

    let normalTotal = 0;

    let warningTotal = 0;

    let dangerTotal = 0;


    Object.keys(sensorConfig).forEach(key => {

        const config = sensorConfig[key];

        const result = membership(

            data[key],

            config.warning,

            config.danger

        );


        const weight = config.weight;


        const membershipSum =
            result.normal +
            result.warning +
            result.danger;


        const sensorScore = (

            result.normal * 10 +

            result.warning * 55 +

            result.danger * 100

        ) / membershipSum;


        totalScore += sensorScore * weight;

        totalWeight += weight;


        normalTotal += result.normal;

        warningTotal += result.warning;

        dangerTotal += result.danger;

    });


    const score = totalScore / totalWeight;

    const membershipTotal =
        normalTotal + warningTotal + dangerTotal;


    return {

        score: Math.round(score),

        normal: Math.round(
            normalTotal / membershipTotal * 100
        ),

        warning: Math.round(
            warningTotal / membershipTotal * 100
        ),

        danger: Math.round(
            dangerTotal / membershipTotal * 100
        )

    };

}


// ==========================================
// 8. STATUS SENSOR
// ==========================================

function getSensorStatus(value, config) {

    if (value >= config.danger) {

        return "BAHAYA";

    }

    if (value >= config.warning) {

        return "WASPADA";

    }

    return "NORMAL";

}


// ==========================================
// 9. UPDATE SENSOR CARD
// ==========================================

function updateSensorCard(
    valueId,
    statusId,
    value,
    config,
    decimal = 2
) {

    document.getElementById(valueId).textContent =
        value.toFixed(decimal);


    const statusElement =
        document.getElementById(statusId);


    const status = getSensorStatus(value, config);


    statusElement.textContent = status;

    statusElement.className = "sensor-status";


    if (status === "NORMAL") {

        statusElement.classList.add("normal");

    }

    else if (status === "WASPADA") {

        statusElement.classList.add("warning");

    }

    else {

        statusElement.classList.add("danger");

    }

}


// ==========================================
// 10. UPDATE FUZZY PANEL
// ==========================================

function updateFuzzy(result) {

    const score = result.score;


    document.getElementById("anomalyScore").textContent =
        score;


    document.getElementById("scoreProgress").style.width =
        score + "%";


    document.getElementById("normalValue").textContent =
        result.normal + "%";


    document.getElementById("warningValue").textContent =
        result.warning + "%";


    document.getElementById("dangerValue").textContent =
        result.danger + "%";


    const statusElement =
        document.getElementById("fuzzyStatus");


    const description =
        document.getElementById("fuzzyDescription");


    const progress =
        document.getElementById("scoreProgress");


    const overallStatus =
        document.getElementById("overallStatus");


    if (score < 35) {

        statusElement.textContent = "NORMAL";

        description.textContent =
            "Parameter sensor berada pada kondisi normal berdasarkan ambang simulasi.";

        statusElement.style.color = "#16a34a";

        progress.style.background = "#22c55e";

        overallStatus.textContent = "NORMAL";

        overallStatus.style.color = "#4ade80";

    }

    else if (score < 70) {

        statusElement.textContent = "WASPADA";

        description.textContent =
            "Terdapat peningkatan beberapa parameter sensor. Diperlukan pemantauan lebih lanjut.";

        statusElement.style.color = "#d97706";

        progress.style.background = "#f59e0b";

        overallStatus.textContent = "WASPADA";

        overallStatus.style.color = "#fbbf24";

    }

    else {

        statusElement.textContent = "BAHAYA";

        description.textContent =
            "Terdapat penyimpangan tinggi pada parameter sensor simulasi.";

        statusElement.style.color = "#dc2626";

        progress.style.background = "#ef4444";

        overallStatus.textContent = "BAHAYA";

        overallStatus.style.color = "#f87171";

    }

}


// ==========================================
// 11. GRAFIK CHART.JS
// ==========================================

const chartContext =
    document.getElementById("sensorChart");


const sensorChart = new Chart(chartContext, {

    type: "line",

    data: {

        labels: [],

        datasets: [

            {

                label: "SO₂ (ppm)",

                data: [],

                borderColor: "#2563eb",

                backgroundColor: "#2563eb",

                tension: 0.3

            },

            {

                label: "H₂S (ppm)",

                data: [],

                borderColor: "#16a34a",

                backgroundColor: "#16a34a",

                tension: 0.3

            },

            {

                label: "CO₂ (ppm)",

                data: [],

                borderColor: "#9333ea",

                backgroundColor: "#9333ea",

                tension: 0.3

            },

            {

                label: "Temperatur (°C)",

                data: [],

                borderColor: "#ea580c",

                backgroundColor: "#ea580c",

                tension: 0.3

            }

        ]

    },

    options: {

        responsive: true,

        maintainAspectRatio: false,

        interaction: {

            mode: "index",

            intersect: false

        },

        plugins: {

            legend: {

                position: "bottom"

            },

            title: {

                display: true,

                text: "Grafik Perubahan Data Sensor"

            }

        },

        scales: {

            y: {

                beginAtZero: true,

                title: {

                    display: true,

                    text: "Nilai Sensor"

                }

            },

            x: {

                title: {

                    display: true,

                    text: "Waktu Pembacaan"

                }

            }

        }

    }

});


// ==========================================
// 12. UPDATE GRAFIK
// ==========================================

function updateChart(data, time) {

    sensorChart.data.labels.push(time);


    sensorChart.data.datasets[0].data.push(data.SO2);

    sensorChart.data.datasets[1].data.push(data.H2S);

    sensorChart.data.datasets[2].data.push(data.CO2);

    sensorChart.data.datasets[3].data.push(data.Temp);


    if (sensorChart.data.labels.length > 20) {

        sensorChart.data.labels.shift();

        sensorChart.data.datasets.forEach(dataset => {

            dataset.data.shift();

        });

    }


    sensorChart.update();

}


// ==========================================
// 13. SIMPAN RIWAYAT
// ==========================================

function saveHistory(data, fuzzyResult, status) {

    const now = new Date();


    const record = {

        time: now.toLocaleString("id-ID"),

        SO2: data.SO2,

        H2S: data.H2S,

        CO2: data.CO2,

        Temp: data.Temp,

        score: fuzzyResult.score,

        status: status

    };


    historyData.unshift(record);


    // Maksimal 100 data.

    historyData = historyData.slice(0, 100);


    try {

        localStorage.setItem(

            "volcanoHistory",

            JSON.stringify(historyData)

        );

    }

    catch (error) {

        console.error(
            "Gagal menyimpan riwayat:",
            error
        );

    }


    renderHistory();

}


// ==========================================
// 14. TAMPILKAN RIWAYAT
// ==========================================

function renderHistory() {

    const table =
        document.getElementById("historyTable");


    table.innerHTML = "";


    historyData.forEach(record => {

        const row = document.createElement("tr");


        const values = [

            record.time,

            record.SO2.toFixed(2),

            record.H2S.toFixed(2),

            record.CO2.toFixed(0),

            record.Temp.toFixed(1),

            record.score

        ];


        values.forEach(value => {

            const cell = document.createElement("td");

            cell.textContent = value;

            row.appendChild(cell);

        });


        const statusCell = document.createElement("td");


        const badge = document.createElement("span");


        badge.textContent = record.status;


        badge.className =

            "sensor-status " +

            (

                record.status === "NORMAL"

                    ? "normal"

                    : record.status === "WASPADA"

                    ? "warning"

                    : "danger"

            );


        statusCell.appendChild(badge);

        row.appendChild(statusCell);

        table.appendChild(row);

    });

}


// ==========================================
// 15. HAPUS RIWAYAT
// ==========================================

function clearHistory() {

    const confirmation = confirm(

        "Apakah kamu yakin ingin menghapus seluruh riwayat?"

    );


    if (!confirmation) {

        return;

    }


    historyData = [];


    localStorage.removeItem("volcanoHistory");


    renderHistory();

}


// ==========================================
// 16. UPDATE DASHBOARD
// ==========================================

function updateDashboard() {

    // SO2

    updateSensorCard(

        "valueSO2",

        "statusSO2",

        sensorData.SO2,

        sensorConfig.SO2

    );


    // H2S

    updateSensorCard(

        "valueH2S",

        "statusH2S",

        sensorData.H2S,

        sensorConfig.H2S

    );


    // CO2

    updateSensorCard(

        "valueCO2",

        "statusCO2",

        sensorData.CO2,

        sensorConfig.CO2,

        0

    );


    // TEMPERATUR

    updateSensorCard(

        "valueTemp",

        "statusTemp",

        sensorData.Temp,

        sensorConfig.Temp,

        1

    );


    // FUZZY LOGIC

    const fuzzyResult = fuzzyLogic(sensorData);


    let status = "NORMAL";


    if (fuzzyResult.score >= 70) {

        status = "BAHAYA";

    }

    else if (fuzzyResult.score >= 35) {

        status = "WASPADA";

    }


    updateFuzzy(fuzzyResult);


    // WAKTU

    const now = new Date();


    const time = now.toLocaleTimeString("id-ID");


    document.getElementById("currentTime").textContent =

        now.toLocaleString("id-ID");


    // GRAFIK

    updateChart(sensorData, time);


    // RIWAYAT

    saveHistory(sensorData, fuzzyResult, status);

}


// ==========================================
// 17. EXPORT CSV
// ==========================================

function exportCSV() {

    if (historyData.length === 0) {

        alert("Belum ada data sensor yang dapat diekspor!");

        return;

    }


    const headers = [

        "Waktu",

        "SO2 (ppm)",

        "H2S (ppm)",

        "CO2 (ppm)",

        "Temperatur (C)",

        "Skor Anomali",

        "Status"

    ];


    const rows = historyData.map(record => [

        record.time,

        record.SO2.toFixed(2),

        record.H2S.toFixed(2),

        record.CO2.toFixed(0),

        record.Temp.toFixed(1),

        record.score,

        record.status

    ]);


    const csvContent = [

        headers,

        ...rows

    ].map(row =>

        row.map(value =>

            `"${String(value).replace(/"/g, '""')}"`

        ).join(",")

    ).join("\r\n");


    const blob = new Blob(

        ["\uFEFF" + csvContent],

        {

            type: "text/csv;charset=utf-8;"

        }

    );


    const url = URL.createObjectURL(blob);


    const link = document.createElement("a");


    const date = new Date();


    const filename =

        "data_sensor_gunung_berapi_" +

        date.toISOString().slice(0, 10) +

        ".csv";


    link.href = url;

    link.download = filename;


    document.body.appendChild(link);


    link.click();


    document.body.removeChild(link);


    URL.revokeObjectURL(url);


    alert("Data sensor berhasil diekspor ke CSV!");

}


// ==========================================
// 18. JAM REAL TIME
// ==========================================

function updateClock() {

    document.getElementById("currentTime").textContent =

        new Date().toLocaleString("id-ID");

}


// ==========================================
// 19. INISIALISASI DASHBOARD
// ==========================================

// Tampilkan riwayat sebelumnya.

renderHistory();


// Tampilkan data awal.

generateDummy("normal");


// Perbarui data otomatis setiap 5 detik.

setInterval(function() {

    generateDummy("random");

}, 2000);


// Update jam setiap detik.

setInterval(updateClock, 1000);

updateClock();