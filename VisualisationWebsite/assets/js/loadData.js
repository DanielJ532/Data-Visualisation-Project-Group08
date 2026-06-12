function loadGeneralHospitalizationData() {
    return d3.csv("assets/data/generalHospitalization.csv", d => ({
        remoteness: d["ABS remoteness area"],
        "2011": +d["2011+Mean(Count of cases)"],
        "2012": +d["2012+Mean(Count of cases)"],
        "2013": +d["2013+Mean(Count of cases)"],
        "2014": +d["2014+Mean(Count of cases)"],
        "2015": +d["2015+Mean(Count of cases)"],
        "2016": +d["2016+Mean(Count of cases)"],
        "2017": +d["2017+Mean(Count of cases)"],
        "2018": +d["2018+Mean(Count of cases)"],
        "2019": +d["2019+Mean(Count of cases)"],
        "2020": +d["2020+Mean(Count of cases)"],
        "2021": +d["2021+Mean(Count of cases)"]
    })).then(data => {
        const filteredData = data.filter(d => d.remoteness !== "Missing");
        const chartData = years.map(year => {
            const obj = { year };
            remotenessCategories.forEach(cat => {
                const row = filteredData.find(d => d.remoteness === cat);
                obj[cat] = row ? row[year] : 0;
            });
            return obj;
        });
        return chartData;
    }).catch(error => {
        console.error("Error loading general hospitalization data:", error);
    });
}

function loadRoadCrashData() {
    return d3.csv("assets/data/First_Nations_hospitalised_injuries_from_road_crashes_by_remoteness.csv", d => ({
        year: d["Calendar year"],
        period: d["6-monthly"],
        indigenousStatus: d["First Nations status"],
        remoteness: d["ABS remoteness area"],
        hospitalisations: +d["Hospitalisations"],
        bedDays: +d["Bed days excluding died in hospitals within 30 days"]
    })).then(data => {
        return data;
    }).catch(error => {
        console.error("Error loading road crash data:", error);
    });
}

function loadGeneralPopNormalisedData() {
    return d3.csv("assets/data/generalPopNormalised.csv");
}

function loadFirstNationNormalisedData() {
    return d3.csv("assets/data/firstNationNormalised.csv");
}

function loadFirstNationRawData() {
    return d3.csv("assets/data/firstNationRaw.csv");
}

function loadGeneralPopVer3Data() {
    return d3.csv("assets/data/generalPopVer3.csv");
}