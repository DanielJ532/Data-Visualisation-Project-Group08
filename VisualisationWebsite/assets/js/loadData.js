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
        console.log(data);
        const filteredData = data.filter(d => d.remoteness !== "Missing");
        
        // Transform from row-based to column-based structure
        const categories = ["Major Cities", "Regional", "Remote"];
        const years = ["2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021"];
        
        const chartData = years.map(year => {
            const obj = { year };
            categories.forEach(cat => {
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
        hospitalisations: +d["Hospitalisations"]
    })).then(data => {
        return data; 
    });
}