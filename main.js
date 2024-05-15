class HousingData {
    constructor(file) {
        this.file = file;
        this.data = [];
        this.roomTypes = []; // добавляем массив для типов комнат
    }

    async loadData() {
        const reader = new FileReader();
        reader.readAsText(this.file);

        return new Promise((resolve, reject) => {
            reader.onload = () => {
                const lines = reader.result.split('\n').filter(line => line.trim() !== '');

                lines.forEach(line => {
                    const parts = line.split(',');

                    if (this.roomTypes.length === 0) {
                        for (let i = 1; i < parts.length; i++) {
                            this.roomTypes.push(`room${i}Price`); // создаем метки для типов комнат
                        }
                    }

                    let row = { year: Number(parts[0]) };

                    for (let i = 1; i < parts.length; i++) {
                        row[this.roomTypes[i - 1]] = Number(parts[i]);
                    }

                    this.data.push(row);
                });

                resolve();
            };
            reader.onerror = reject;
        });
    }

    createTable(containerId) {
        const table = document.createElement('table');
        const headerRow = document.createElement('tr');

        const headers = ['Год', ...this.roomTypes.map((room, index) => `${index + 1}-Жилье`)];
        headers.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });

        table.appendChild(headerRow);

        this.data.forEach(row => {
            const tr = document.createElement('tr');
            headers.map(header => {
                const key = header === 'Год' ? 'year' : this.roomTypes[headers.indexOf(header) - 1];
                const td = document.createElement('td');
                td.textContent = row[key];
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });

        document.getElementById(containerId).appendChild(table);
    }

    createChart(canvasId) {
        const years = this.data.map(row => row.year);

        const datasets = this.roomTypes.map((roomType, index) => ({
            label: `${index + 1}-Жилье`,
            borderColor: this.getRandomColor(), // генерируем случайные цвета
            data: this.data.map(row => row[roomType])
        }));

        new Chart(document.getElementById(canvasId), {
            type: 'line',
            data: {
                labels: years,
                datasets: datasets
            }
        });
    }

    extrapolate(maWindow, futureYears) {
        const extrapolatedData = [];

        const calculateMovingAverage = (arr, window) => {
            return arr.slice(-window).reduce((sum, x) => sum + x, 0) / window;
        };

        for (let i = 0; i < futureYears; i++) {
            const lastYearData = this.data[this.data.length - 1];
            const year = lastYearData.year + 1;
            let newRow = { year };

            this.roomTypes.forEach(roomType => {
                const values = this.data.map(row => row[roomType]);
                newRow[roomType] = calculateMovingAverage(values, maWindow);
            });

            this.data.push(newRow);
            extrapolatedData.push(newRow);
        }
        this.data = this.data.concat(extrapolatedData);
    }

    calculatePriceChanges(containerId) {
        const priceChanges = this.roomTypes.map(roomType => {
            const initialPrice = this.data[0][roomType];
            const finalPrice = this.data[this.data.length - 1][roomType];

            return {
                roomType,
                change: finalPrice - initialPrice
            };
        });

        priceChanges.sort((a, b) => b.change - a.change);

        const container = document.getElementById(containerId);
        container.innerHTML = `<strong>Квартиры:</strong><br>
            <span>Сильнее всего подорожали: ${this.formatRoomType(priceChanges[0].roomType)} (${priceChanges[0].change.toFixed(2)})<br></span>
            <span>Сильнее всего подешевели: ${this.formatRoomType(priceChanges[priceChanges.length - 1].roomType)} (${priceChanges[priceChanges.length - 1].change.toFixed(2)})</span>`;
    }

    formatRoomType(roomType) {
        const number = roomType.match(/\d+/)[0];
        return `${number}-Жилье`;
    }

    // Функция для генерации случайного цвета для каждого типа комнаты
    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }
}

// Используем класс для отображения данных
(async () => {
    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        const housingData = new HousingData(file);
        await housingData.loadData();

        housingData.createTable('dataTableContainer');
        housingData.createChart('dataChartContainer');
        housingData.calculatePriceChanges('priceChangesContainer');
    });
})();