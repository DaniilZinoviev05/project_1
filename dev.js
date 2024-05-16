document.getElementById('fileInput').addEventListener('change', handleFileSelect);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = e.target.result;
            displayData(data);
        };
        reader.readAsText(file);
    }
}

function displayData(txtData) {
    const parsedData = parseTextData(txtData);
    createTable(parsedData);
    createChart(parsedData);
}

function parseTextData(text) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split('\t'); 

    const data = lines.slice(1).map(line => {
        const values = line.split('\t');
        return headers.reduce((object, header, index) => {
            object[header.trim()] = parseFloat(values[index].trim());
            return object;
        }, {});
    });

    return {
        headers,
        data
    };
}

function createTable({ headers, data }) {
    const tableContainer = document.getElementById('tableContainer');
    const table = document.createElement('table');
    const headerRow = document.createElement('tr');

    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    data.forEach(rowObj => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = rowObj[header];
            row.appendChild(td);
        });
        table.appendChild(row);
    });

    tableContainer.innerHTML = '';  
    tableContainer.appendChild(table);
}

function createChart({ headers, data }) {
    const years = data.map(row => row.Year);
    const inflationRates = data.map(row => row.Inflation);

    const ctx = document.getElementById('dataChartContainer').getContext('2d');

    const chartData = {
        labels: years,
        datasets: [{
            label: 'Инфляция',
            data: inflationRates,
            borderColor: 'blue',
            fill: false
        }]
    };

    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Год'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Инфляция (%)'
                    }
                }
            }
        }
    });

    addExtrapolation(years, inflationRates, ctx);
}

function addExtrapolation(years, inflationRates, ctx) {
    const N = 5; // Number of years to predict
    const lastYears = years.slice(-N);
    const lastRates = inflationRates.slice(-N);

    const movingAverage = (arr) => arr.reduce((acc, val) => acc + val, 0) / arr.length;

    let extrapolatedRates = [];
    for (let i = 0; i < N; i++) {
        const nextRate = movingAverage(extrapolatedRates.slice(-N).concat(lastRates));
        extrapolatedRates.push(nextRate);
    }

    const futureYears = Array.from({ length: N }, (_, i) => years[years.length - 1] + i + 1);

    const extrapolatedData = {
        labels: futureYears,
        datasets: [{
            label: 'Прогнозируемая инфляция',
            data: extrapolatedRates,
            borderColor: 'red',
            fill: false,
            borderDash: [5, 5]
        }]
    };

    const combinedData = {
        labels: years.concat(futureYears),
        datasets: [
            ...ctx.data.datasets,
            ...extrapolatedData.datasets,
        ],
    };

    new Chart(ctx, {
        type: 'line',
        data: combinedData,
        options: {
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Год'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Инфляция (%)'
                    }
                }
            }
        }
    });

    calculateFutureCost(inflationRates, extrapolatedRates);
}

function calculateFutureCost(inflationRates, extrapolatedRates) {
    const initialCost = 100; 
    const cumulativeInflationRate = (rates) => {
        return rates.reduce((acc, rate) => acc * (1 + rate / 100), 1);
    };

    const futureCost = initialCost * cumulativeInflationRate(extrapolatedRates);
    document.getElementById('priceChangesContainer').innerText = `Стоимость через N лет: ${futureCost.toFixed(2)} руб.`;
}