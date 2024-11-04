Module.register("MMM-VGIWiesty", {
    defaults: {
        maxEntries: 5,
        station: "IN-ZOB",
        overwriteIP: false,
        customURL: "",
        customPort: ""                  
    },

    start: function () {
        Log.info('%cMMM-VGIWiesty loaded.', 'background: #0085c2; color: #6ac000');
        this.departures = [];
        this.loadDepartures();
        this.scheduleUpdate();
    },

    getStyles: function () {
        return ["MMM-VGIWiesty.css"];
    },

    getHeader: function () {
        return this.config.header && this.config.header !== "" ? this.config.header : "VGI Abfahrtsmonitor";
    },

    getDom: function () {
        var wrapper = document.createElement("div");
        wrapper.classList.add("vgi-table-wrapper");

        if (this.departures.length > 0) {
            var table = document.createElement("table");
            table.classList.add("vgi-table");

            for (var i = 0; i < this.departures.length && i < this.config.maxEntries; i++) {
                var departure = this.departures[i];
                var row = document.createElement("tr");
                row.classList.add("departure-row");

                var iconCell = document.createElement("td");
                iconCell.classList.add("icon-cell");
                var lineImage = document.createElement("img");
                lineImage.classList.add("productsvg");
                lineImage.src = this.getLineIcon(departure.route);
                iconCell.appendChild(lineImage);
                row.appendChild(iconCell);

                var lineCell = document.createElement("td");
                lineCell.classList.add("line-cell");
                lineCell.innerHTML = departure.route;
                row.appendChild(lineCell);

                var directionCell = document.createElement("td");
                directionCell.classList.add("direction-cell");
                directionCell.innerHTML = this.correctGermanCharacters(departure.destination);
                row.appendChild(directionCell);

                var timeCell = document.createElement("td");
                timeCell.classList.add("time-cell");
                timeCell.innerHTML = departure.strTime + (departure.realtime ? "" : " *");
                row.appendChild(timeCell);

                table.appendChild(row);
            }

            var footerRow = document.createElement("tr");
            var footerCell = document.createElement("td");
            footerCell.colSpan = 4;
            footerCell.classList.add("footer-cell");
            footerCell.innerHTML = "* = geplante Abfahrt";
            footerRow.appendChild(footerCell);
            table.appendChild(footerRow);

            wrapper.appendChild(table);
        } else {
            wrapper.innerHTML = "Keine Abfahrten gefunden.";
        }

        return wrapper;
    },

    getLineIcon: function (route) {
        return "https://www.vgi.de/IconServlet?line=" + route;
    },

    loadDepartures: function () {
        var self = this;
        var station = encodeURIComponent(this.config.station);

        var baseUrl;
        if (this.config.overwriteIP) {
            baseUrl = `${this.config.customURL}:${this.config.customPort}/cors?url=`;
        } else {
            baseUrl = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/cors?url=`;
        }

        var url = `${baseUrl}https://www.vgi.de/rt/getRealtimeData.action?stopPoint=1&station=${station}&sid=`;
        Log.info(url); 
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        var sanitizedResponseText = xhr.responseText.replace(/[^\x20-\x7E]+/g, "");
                        var response = JSON.parse(sanitizedResponseText);
                        if (response && response.departures && response.departures.length > 0) {
                            self.departures = response.departures;
                            self.updateDom();
                        }
                    } catch (error) {
                        Log.error("MMM-VGIWiesty: JSON Parsing Error:", error);
                        Log.error("Sanitized Response was:", sanitizedResponseText);
                    }
                } else {
                    Log.error("MMM-VGIWiesty: Failed to load departures. Status:", xhr.status);
                    Log.error("Response was:", xhr.responseText);
                }
            }
        };
               
        xhr.send();
    },

    scheduleUpdate: function () {
        var self = this;
        setInterval(function () {
            self.loadDepartures();
        }, 60000);
    },

    correctGermanCharacters: function (text) {
        return text.replace("strae", "straße");
    }
});
