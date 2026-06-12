const margin = { top: 20, right: 30, bottom: 50, left: 75 };
const width = 820;
const height = 440;
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const remotenessColors = {
    "Major Cities": "#2196F3",
    "Regional": "#FF9800",
    "Remote": "#E53935"
};

const indigenousColors = {
    "First Nations": "#E53935",
    "Non-Indigenous": "#2196F3"
};

const comparisonColors = {
    "Major Cities (General)": "#4575b4",
    "Major Cities (Aboriginal)": "#74add1",
    "Regional (General)": "#f46d43",
    "Regional (Aboriginal)": "#fdae61",
    "Remote (General)": "#a50026",
    "Remote (Aboriginal)": "#d73027"
};

const lineColors = {
    "Major Cities": "#4575b4",
    "Regional": "#f46d43",
    "Remote": "#a50026"
};

const remotenessCategories = ["Major Cities", "Regional", "Remote"];
const years = ["2011","2012","2013","2014","2015","2016","2017","2018","2019","2020","2021"];

let svg, x0, x1, yScale, tooltip;
let svgIndigenous, x0Indigenous, x1Indigenous, yScaleIndigenous;