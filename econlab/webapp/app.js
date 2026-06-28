/**
 * EconomicsLab Dashboard -- Interactive Economics Computing
 * ==========================================================
 * Client-side model estimation and visualization using Plotly.js and math.js.
 */

(function () {
  'use strict';

  // =========================================================================
  // Synthetic Data Generators (mirrors econlab.datasets in Python)
  // =========================================================================

  function generateNLSY(seed) {
    if (seed === undefined) seed = 42;
    // Simple LCG for reproducibility
    var rng = lcg(seed);
    var nPersons = 500;
    var nYears = 5;
    var data = [];
    for (var i = 0; i < nPersons; i++) {
      var female = rng() < 0.5 ? 1 : 0;
      var race = rng() < 0.7 ? 0 : rng() < 0.5 ? 1 : 2;
      var ability = randn(rng) * 0.5;
      var baseEdu = clamp(Math.round(8 + randn(rng) * 2 + ability * 3), 6, 20);
      for (var t = 0; t < nYears; t++) {
        var year = 1980 + t;
        var age = 18 + t;
        var education = Math.min(baseEdu + t, 20);
        var experience = clamp(age - education - 6 + Math.round(randn(rng)), 0, 50);
        var tenure = clamp(Math.round(experience * 0.5 + randn(rng) * 2), 0, experience);
        var logWage = 1.5 + 0.08 * education + 0.03 * experience - 0.0005 * experience * experience - 0.15 * female + ability + randn(rng) * 0.3;
        var wage = Math.exp(logWage);
        var hours = clamp(30 + randn(rng) * 10, 5, 60);
        var union = rng() < 0.25 ? 1 : 0;
        data.push({
          id: i + 1,
          year: year,
          age: age,
          female: female,
          race: race,
          education: education,
          experience: experience,
          tenure: tenure,
          log_wage: parseFloat(logWage.toFixed(4)),
          wage: parseFloat(wage.toFixed(2)),
          hours: parseFloat(hours.toFixed(1)),
          union: union,
        });
      }
    }
    return data;
  }

  function generateAngristKrueger(seed) {
    if (seed === undefined) seed = 123;
    var rng = lcg(seed);
    var n = 2000;
    var data = [];
    var yobs = [30, 31, 32, 33, 34, 35, 36, 37, 38, 39];
    for (var i = 0; i < n; i++) {
      var yob = yobs[Math.floor(rng() * yobs.length)];
      var qob = Math.floor(rng() * 4) + 1;
      var education = clamp(Math.round(10 + (yob - 30) * 0.3 + (qob - 1) * 0.5 + randn(rng) * 2), 0, 20);
      var logWage = 5.0 + 0.07 * education + 0.03 * (yob - 30) + randn(rng) * 0.5;
      var wage = Math.exp(logWage);
      data.push({
        log_wage: parseFloat(logWage.toFixed(4)),
        wage: parseFloat(wage.toFixed(2)),
        education: education,
        yob: yob,
        qob: qob,
        quarter_born: qob,
        age: 50 - (yob - 1900) / 4,
      });
    }
    return data;
  }

  function generateCardMinWage(seed) {
    if (seed === undefined) seed = 456;
    var rng = lcg(seed);
    var n = 400;
    var data = [];
    for (var i = 0; i < n; i++) {
      var state = rng() < 0.5 ? 'NJ' : 'PA';
      var treated = state === 'NJ' ? 1 : 0;
      var period = i % 2 === 0 ? 'before' : 'after';
      var post = period === 'after' ? 1 : 0;
      var fteBase = 20 + randn(rng) * 5;
      var treatEffect = treated && post ? 2.75 : 0; // Card & Krueger DiD estimate
      var fte = fteBase + treatEffect + randn(rng) * 4;
      var wage = state === 'NJ' && post ? 5.05 + randn(rng) * 0.3 : 4.25 + randn(rng) * 0.3;
      data.push({
        store_id: i + 1,
        state: state,
        treated: treated,
        time_period: period,
        post: post,
        fte: parseFloat(Math.max(0, fte).toFixed(1)),
        wage: parseFloat(Math.max(3, wage).toFixed(2)),
      });
    }
    return data;
  }

  // =========================================================================
  // Math Utilities
  // =========================================================================

  function lcg(seed) {
    var s = seed;
    return function () {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
  }

  function randn(rng) {
    var u1 = rng() || 0.001;
    var u2 = rng() || 0.001;
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  function clamp(x, lo, hi) {
    return Math.max(lo, Math.min(hi, x));
  }

  function mean(arr) {
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += arr[i];
    return s / arr.length;
  }

  function std(arr) {
    var m = mean(arr);
    var s = 0;
    for (var i = 0; i < arr.length; i++) s += (arr[i] - m) * (arr[i] - m);
    return Math.sqrt(s / (arr.length - 1));
  }

  function cov(x, y) {
    var mx = mean(x);
    var my = mean(y);
    var s = 0;
    for (var i = 0; i < x.length; i++) s += (x[i] - mx) * (y[i] - my);
    return s / (x.length - 1);
  }

  function tDistCDF(t, df) {
    // Approximation of Student's t CDF
    var x = df / (df + t * t);
    var a = df / 2;
    var b = 0.5;
    return 0.5 * (1 + regularizedBeta(b, a, x));
  }

  function regularizedBeta(a, b, x) {
    // Simple approximation
    if (x > 1) x = 1;
    if (x < 0) x = 0;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    if (x < (a + 1) / (a + b + 2)) {
      return bt * betaCf(a, b, x) / a;
    }
    return 1 - bt * betaCf(b, a, 1 - x) / b;
  }

  function betaCf(a, b, x) {
    var MAXIT = 100;
    var EPS = 3e-7;
    var qab = a + b;
    var qap = a + 1;
    var qam = a - 1;
    var c = 1;
    var d = 1 - qab * x / qap;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    var h = d;
    for (var m = 1; m <= MAXIT; m++) {
      var m2 = 2 * m;
      var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d;
      if (Math.abs(d) < 1e-30) d = 1e-30;
      c = 1 + aa / c;
      if (Math.abs(c) < 1e-30) c = 1e-30;
      d = 1 / d;
      var del = d * c;
      h *= del;
      if (Math.abs(del - 1) < EPS) break;
    }
    return h;
  }

  function lgamma(z) {
    if (z < 0) return 0;
    var x = 0;
    x += 0.1659470187408462e-6 / (z + 7);
    x += 0.9934937113930748e-5 / (z + 6);
    x -= 0.1385710331296526 / (z + 5);
    x += 12.50734324009056 / (z + 4);
    x -= 176.6150291498386 / (z + 3);
    x += 771.3234287757674 / (z + 2);
    x -= 1259.139216722289 / (z + 1);
    x += 676.5203681218835 / z;
    x += 0.9999999999995183;
    return Math.log(x) - 5.58106146679532777 - z + (z - 0.5) * Math.log(z + 6.5);
  }

  // =========================================================================
  // OLS Estimation
  // =========================================================================

  function transpose(m) {
    var rows = m.length;
    var cols = m[0].length;
    var t = [];
    for (var j = 0; j < cols; j++) {
      t[j] = [];
      for (var i = 0; i < rows; i++) t[j][i] = m[i][j];
    }
    return t;
  }

  function matMul(a, b) {
    var aRows = a.length;
    var aCols = a[0].length;
    var bCols = b[0].length;
    var result = [];
    for (var i = 0; i < aRows; i++) {
      result[i] = [];
      for (var j = 0; j < bCols; j++) {
        var sum = 0;
        for (var k = 0; k < aCols; k++) sum += a[i][k] * b[k][j];
        result[i][j] = sum;
      }
    }
    return result;
  }

  function invert2x2(m) {
    var det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
    return [
      [m[1][1] / det, -m[0][1] / det],
      [-m[1][0] / det, m[0][0] / det],
    ];
  }

  function invert3x3(m) {
    var a = m[0][0], b = m[0][1], c = m[0][2];
    var d = m[1][0], e = m[1][1], f = m[1][2];
    var g = m[2][0], h = m[2][1], i = m[2][2];
    var det = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
    return [
      [(e * i - f * h) / det, (c * h - b * i) / det, (b * f - c * e) / det],
      [(f * g - d * i) / det, (a * i - c * g) / det, (c * d - a * f) / det],
      [(d * h - e * g) / det, (b * g - a * h) / det, (a * e - b * d) / det],
    ];
  }

  function ols(X, y, robust) {
    var n = X.length;
    var k = X[0].length;
    var Xt = transpose(X);
    var XtX = matMul(Xt, X);

    // Invert X'X
    var XtXInv;
    if (k === 1) XtXInv = [[1 / XtX[0][0]]];
    else if (k === 2) XtXInv = invert2x2(XtX);
    else if (k === 3) XtXInv = invert3x3(XtX);
    else return null; // beyond 3 vars not supported

    var XtY = matMul(Xt, y.map(function (v) { return [v]; }));
    var beta = matMul(XtXInv, XtY);

    // Fitted values and residuals
    var yHat = [];
    var residuals = [];
    for (var i = 0; i < n; i++) {
      var yh = 0;
      for (var j = 0; j < k; j++) yh += beta[j][0] * X[i][j];
      yHat.push(yh);
      residuals.push(y[i] - yh);
    }

    // Standard errors
    var sse = 0;
    for (var i = 0; i < n; i++) sse += residuals[i] * residuals[i];
    var sigma2 = sse / (n - k);
    var df = n - k;

    var se = [];
    var tStat = [];
    var pVal = [];
    var ciLow = [];
    var ciHigh = [];

    if (robust) {
      // HC1 robust SE
      var meat = [];
      for (var j = 0; j < k; j++) {
        meat[j] = [];
        for (var l = 0; l < k; l++) {
          var s = 0;
          for (var i = 0; i < n; i++) s += X[i][j] * X[i][l] * residuals[i] * residuals[i];
          meat[j][l] = s;
        }
      }
      var bread1 = matMul(XtXInv, meat);
      var sandwich = matMul(bread1, XtXInv);
      var adj = n / (n - k);
      for (var j = 0; j < k; j++) {
        var sej = Math.sqrt(Math.abs(sandwich[j][j]) * adj);
        se.push(sej);
      }
    } else {
      for (var j = 0; j < k; j++) {
        se.push(Math.sqrt(sigma2 * XtXInv[j][j]));
      }
    }

    for (var j = 0; j < k; j++) {
      var t = beta[j][0] / se[j];
      tStat.push(t);
      var p = 2 * (1 - tP(Math.abs(t), df));
      pVal.push(p);
      var ci = 1.96 * se[j]; // approximate
      ciLow.push(beta[j][0] - ci);
      ciHigh.push(beta[j][0] + ci);
    }

    // R-squared
    var yMean = mean(y);
    var sst = 0;
    for (var i = 0; i < n; i++) sst += (y[i] - yMean) * (y[i] - yMean);
    var r2 = 1 - sse / sst;
    var adjR2 = 1 - (1 - r2) * (n - 1) / (n - k);
    var fStat = ((sst - sse) / (k - 1)) / (sse / (n - k));

    return {
      beta: beta.map(function (v) { return v[0]; }),
      se: se,
      tStat: tStat,
      pVal: pVal,
      ciLow: ciLow,
      ciHigh: ciHigh,
      r2: r2,
      adjR2: adjR2,
      fStat: fStat,
      n: n,
      df: df,
      yHat: yHat,
      residuals: residuals,
    };
  }

  function tP(t, df) {
    if (t < 0) return 1 - tP(-t, df);
    return 1 - tDistCDF(t, df);
  }

  // =========================================================================
  // IV / 2SLS Estimation
  // =========================================================================

  function iv2sls(data, yVar, endogVar, instrumentVar, xVars, robust) {
    var n = data.length;

    // First stage: endog = gamma * Z + delta * X + error
    var firstX = [ones(n)]; // intercept
    firstX.push(pluck(data, instrumentVar));
    for (var i = 0; i < xVars.length; i++) firstX.push(pluck(data, xVars[i]));
    var yFirst = pluck(data, endogVar);
    var firstStage = ols(transpose(firstX), yFirst, false);

    // Predicted values from first stage
    var endogHat = firstStage.yHat;

    // Second stage: y = beta * endog_hat + gamma * X + error
    var secondX = [ones(n), endogHat];
    for (var i = 0; i < xVars.length; i++) secondX.push(pluck(data, xVars[i]));
    var ySecond = pluck(data, yVar);
    var secondStage = ols(transpose(secondX), ySecond, robust);

    // First stage F-statistic
    var fFirst = firstStage.fStat;

    // Variable names for results
    var names = ['(Intercept)', endogVar + ' (IV)'];
    for (var i = 0; i < xVars.length; i++) names.push(xVars[i]);

    return {
      beta: secondStage.beta,
      se: secondStage.se,
      tStat: secondStage.tStat,
      pVal: secondStage.pVal,
      ciLow: secondStage.ciLow,
      ciHigh: secondStage.ciHigh,
      r2: secondStage.r2,
      adjR2: secondStage.adjR2,
      fStat: secondStage.fStat,
      firstStageF: fFirst,
      n: n,
      names: names,
      yHat: secondStage.yHat,
      residuals: secondStage.residuals,
    };
  }

  // =========================================================================
  // DiD Estimation
  // =========================================================================

  function didEstimate(data, yVar, treatVar, postVar, xVars, robust) {
    var n = data.length;
    var y = pluck(data, yVar);
    var treat = pluck(data, treatVar);
    var post = pluck(data, postVar);

    // Interaction term
    var interact = [];
    for (var i = 0; i < n; i++) interact.push(treat[i] * post[i]);

    var X = [ones(n), treat, post, interact];
    var xNames = ['(Intercept)', treatVar, postVar, treatVar + ' x ' + postVar];
    for (var i = 0; i < (xVars || []).length; i++) {
      X.push(pluck(data, xVars[i]));
      xNames.push(xVars[i]);
    }

    var result = ols(transpose(X), y, robust);
    result.names = xNames;
    return result;
  }

  // =========================================================================
  // Panel Fixed Effects (Within Transformation)
  // =========================================================================

  function feEstimate(data, yVar, xVars, entityVar, robust) {
    var n = data.length;

    // Group by entity
    var groups = {};
    for (var i = 0; i < n; i++) {
      var eid = data[i][entityVar];
      if (!groups[eid]) groups[eid] = [];
      groups[eid].push(i);
    }

    // Within transformation: demean each variable by entity
    var yRaw = pluck(data, yVar);
    var xRaws = [];
    for (var j = 0; j < xVars.length; j++) xRaws.push(pluck(data, xVars[j]));

    var yWithin = new Array(n);
    var xWithins = [];
    for (var j = 0; j < xVars.length; j++) xWithins.push(new Array(n));

    var entityIds = Object.keys(groups);
    for (var g = 0; g < entityIds.length; g++) {
      var indices = groups[entityIds[g]];
      // Calculate group means
      var yMeanG = 0;
      for (var i = 0; i < indices.length; i++) yMeanG += yRaw[indices[i]];
      yMeanG /= indices.length;

      var xMeansG = [];
      for (var j = 0; j < xVars.length; j++) {
        xMeansG[j] = 0;
        for (var i = 0; i < indices.length; i++) xMeansG[j] += xRaws[j][indices[i]];
        xMeansG[j] /= indices.length;
      }

      // Demean
      for (var i = 0; i < indices.length; i++) {
        yWithin[indices[i]] = yRaw[indices[i]] - yMeanG;
        for (var j = 0; j < xVars.length; j++) {
          xWithins[j][indices[i]] = xRaws[j][indices[i]] - xMeansG[j];
        }
      }
    }

    // OLS on within-transformed data (no intercept)
    var X = [];
    for (var j = 0; j < xVars.length; j++) X.push(xWithins[j]);
    var result = ols(transpose(X), yWithin, robust);
    result.names = xVars.slice();
    return result;
  }

  // =========================================================================
  // Logit / Probit (simple approximation via linear probability + transform)
  // =========================================================================

  function logitEstimate(data, yVar, xVars, modelType) {
    var y = pluck(data, yVar);
    var X = [ones(data.length)];
    for (var i = 0; i < xVars.length; i++) X.push(pluck(data, xVars[i]));

    // Run OLS as starting values (linear probability model)
    var lpm = ols(transpose(X), y, true);

    // Use LPM coefficients as approximation, apply logistic transform for marginal effects
    var names = ['(Intercept)'];
    for (var i = 0; i < xVars.length; i++) names.push(xVars[i]);

    // For logit: scale coefficients by ~4 for approximate marginal effects at mean
    // For probit: scale by ~2.5
    var scale = modelType === 'logit' ? 4.0 : 2.5;
    var beta = lpm.beta.map(function (b) { return b * 0.25; }); // approximate logit coefs
    var se = lpm.se.map(function (s) { return s * 0.25; });
    var tStat = [];
    var pVal = [];
    var ciLow = [];
    var ciHigh = [];

    for (var j = 0; j < beta.length; j++) {
      var t = Math.abs(beta[j]) / (se[j] || 0.001);
      tStat.push(t);
      pVal.push(2 * (1 - tP(t, lpm.n)));
      ciLow.push(beta[j] - 1.96 * se[j]);
      ciHigh.push(beta[j] + 1.96 * se[j]);
    }

    // Pseudo R2
    var yMean = mean(y);
    var llNull = 0;
    for (var i = 0; i < y.length; i++) {
      llNull += y[i] * Math.log(yMean + 1e-10) + (1 - y[i]) * Math.log(1 - yMean + 1e-10);
    }
    var llModel = 0;
    for (var i = 0; i < y.length; i++) {
      var yh = lpm.yHat[i];
      yh = Math.max(0.001, Math.min(0.999, yh));
      llModel += y[i] * Math.log(yh) + (1 - y[i]) * Math.log(1 - yh);
    }
    var pseudoR2 = 1 - llModel / llNull;

    return {
      beta: beta,
      se: se,
      tStat: tStat,
      pVal: pVal,
      ciLow: ciLow,
      ciHigh: ciHigh,
      r2: pseudoR2,
      adjR2: pseudoR2,
      fStat: null,
      n: lpm.n,
      names: names,
      yHat: lpm.yHat,
      residuals: lpm.residuals,
    };
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  function ones(n) {
    var arr = new Array(n);
    for (var i = 0; i < n; i++) arr[i] = 1;
    return arr;
  }

  function pluck(arr, key) {
    return arr.map(function (d) { return d[key]; });
  }

  function formatNum(x, decimals) {
    if (decimals === undefined) decimals = 4;
    if (Math.abs(x) < 1e-10) return '0.0000';
    return x.toFixed(decimals);
  }

  function getData(datasetName) {
    switch (datasetName) {
      case 'nlsy': return generateNLSY();
      case 'angrist_krueger': return generateAngristKrueger();
      case 'card_minwage': return generateCardMinWage();
      default: return generateNLSY();
    }
  }

  function generateScatterData(data, yVar, xVar) {
    var trace = {
      x: pluck(data, xVar),
      y: pluck(data, yVar),
      mode: 'markers',
      type: 'scatter',
      marker: {
        size: 5,
        color: '#4f8cff',
        opacity: 0.5,
        line: { width: 0 },
      },
      name: yVar + ' vs ' + xVar,
    };
    return [trace];
  }

  function generateCoefficientChart(beta, se, names) {
    var traces = [];
    var xs = [];
    var ys = [];
    var errors = [];
    var colors = [];

    for (var i = 0; i < beta.length; i++) {
      xs.push(names[i]);
      ys.push(beta[i]);
      errors.push(se[i] * 1.96);
      colors.push(beta[i] >= 0 ? '#3fb950' : '#f85149');
    }

    traces.push({
      x: xs,
      y: ys,
      error_y: {
        type: 'data',
        array: errors,
        visible: true,
        color: '#8b949e',
      },
      type: 'bar',
      marker: { color: colors, opacity: 0.8 },
      name: 'Coefficient',
    });

    return traces;
  }

  function generateSimChart(betas) {
    var trace = {
      x: betas,
      type: 'histogram',
      marker: {
        color: '#4f8cff',
        opacity: 0.7,
        line: { color: '#30363d', width: 1 },
      },
      name: 'Beta Estimates',
      nbinsx: 40,
    };

    return [trace];
  }

  function plotlyLayout(title, xTitle, yTitle) {
    return {
      title: { text: title, font: { color: '#e6edf3', size: 16 } },
      xaxis: { title: xTitle, gridcolor: '#21262d', color: '#8b949e', zerolinecolor: '#30363d' },
      yaxis: { title: yTitle, gridcolor: '#21262d', color: '#8b949e', zerolinecolor: '#30363d' },
      plot_bgcolor: '#0d1117',
      paper_bgcolor: '#0d1117',
      font: { color: '#8b949e' },
      margin: { l: 60, r: 20, t: 50, b: 60 },
      bargap: 0.3,
    };
  }

  // =========================================================================
  // UI Logic
  // =========================================================================

  function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(function (s) {
      s.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(function (n) {
      n.classList.remove('active');
    });

    var section = document.getElementById(sectionName + '-section');
    if (section) section.classList.add('active');

    var navItem = document.querySelector('[data-section="' + sectionName + '"]');
    if (navItem) navItem.classList.add('active');
  }

  function showModelParams(modelName) {
    document.querySelectorAll('.params-panel').forEach(function (p) {
      p.classList.remove('active');
    });
    var panel = document.getElementById('params-' + modelName);
    if (panel) panel.classList.add('active');
  }

  function getModelInputs() {
    var model = document.getElementById('model-select').value;
    var dataset = document.getElementById('dataset-select').value;
    var inputs = { model: model, dataset: dataset };

    switch (model) {
      case 'ols':
        inputs.yVar = document.getElementById('ols-y').value;
        inputs.xVars = getMultiSelect('ols-x');
        inputs.robust = document.getElementById('ols-robust').checked;
        break;
      case 'iv':
        inputs.yVar = document.getElementById('iv-y').value;
        inputs.endogVar = document.getElementById('iv-endog').value;
        inputs.instrumentVar = document.getElementById('iv-instrument').value;
        inputs.xVars = []; // could add exogenous controls
        inputs.robust = true;
        break;
      case 'did':
        inputs.yVar = document.getElementById('did-y').value;
        inputs.treatVar = document.getElementById('did-treat').value;
        inputs.postVar = document.getElementById('did-post').value;
        inputs.xVars = [];
        inputs.robust = true;
        break;
      case 'fe':
        inputs.yVar = document.getElementById('fe-y').value;
        inputs.xVars = getMultiSelect('fe-x');
        inputs.entityVar = document.getElementById('fe-entity').value;
        inputs.robust = true;
        break;
      case 'logit':
        inputs.yVar = document.getElementById('logit-y').value;
        inputs.xVars = ['education', 'experience', 'age'];
        inputs.modelType = document.getElementById('logit-model-type').value;
        inputs.robust = true;
        break;
    }
    return inputs;
  }

  function getMultiSelect(id) {
    var select = document.getElementById(id);
    var result = [];
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].selected) result.push(select.options[i].value);
    }
    return result;
  }

  function estimateModel(inputs) {
    var data = getData(inputs.dataset);

    switch (inputs.model) {
      case 'ols': {
        var X = [ones(data.length)];
        for (var i = 0; i < inputs.xVars.length; i++) X.push(pluck(data, inputs.xVars[i]));
        var y = pluck(data, inputs.yVar);
        var res = ols(transpose(X), y, inputs.robust);
        res.names = ['(Intercept)'].concat(inputs.xVars);
        return res;
      }
      case 'iv': {
        return iv2sls(data, inputs.yVar, inputs.endogVar, inputs.instrumentVar, inputs.xVars, inputs.robust);
      }
      case 'did': {
        return didEstimate(data, inputs.yVar, inputs.treatVar, inputs.postVar, inputs.xVars, inputs.robust);
      }
      case 'fe': {
        return feEstimate(data, inputs.yVar, inputs.xVars, inputs.entityVar, inputs.robust);
      }
      case 'logit': {
        return logitEstimate(data, inputs.yVar, inputs.xVars, inputs.modelType);
      }
      default:
        return null;
    }
  }

  function displayResults(result) {
    var card = document.getElementById('results-card');
    card.style.display = 'block';

    // Coefficient chart
    var chartDiv = document.getElementById('results-chart');
    var chartData = generateCoefficientChart(result.beta, result.se, result.names);
    var chartLayout = plotlyLayout('Coefficient Estimates (95% CI)', '', 'Estimate');
    Plotly.newPlot(chartDiv, chartData, chartLayout, { responsive: true, displayModeBar: false });

    // Results table
    var tbody = document.getElementById('results-tbody');
    tbody.innerHTML = '';
    for (var i = 0; i < result.beta.length; i++) {
      var tr = document.createElement('tr');
      var pClass = result.pVal[i] < 0.05 ? 'p-value-significant' : 'p-value-not-significant';
      var stars = result.pVal[i] < 0.01 ? '***' : result.pVal[i] < 0.05 ? '**' : result.pVal[i] < 0.1 ? '*' : '';
      tr.innerHTML =
        '<td>' + result.names[i] + '</td>' +
        '<td>' + formatNum(result.beta[i]) + stars + '</td>' +
        '<td>' + formatNum(result.se[i]) + '</td>' +
        '<td>' + formatNum(result.tStat[i], 2) + '</td>' +
        '<td class="' + pClass + '">' + formatNum(result.pVal[i]) + '</td>' +
        '<td>[' + formatNum(result.ciLow[i]) + ', ' + formatNum(result.ciHigh[i]) + ']</td>';
      tbody.appendChild(tr);
    }

    // Model statistics
    var statsDiv = document.getElementById('model-stats');
    var metrics = [];
    if (result.r2 !== undefined && result.r2 !== null) {
      metrics.push({ value: formatNum(result.r2, 3), label: 'R-squared' });
      metrics.push({ value: formatNum(result.adjR2, 3), label: 'Adj. R-squared' });
    }
    if (result.fStat !== undefined && result.fStat !== null) {
      metrics.push({ value: formatNum(result.fStat, 2), label: 'F-statistic' });
    }
    metrics.push({ value: result.n, label: 'Observations' });
    if (result.firstStageF !== undefined) {
      metrics.push({ value: formatNum(result.firstStageF, 2), label: '1st-stage F' });
    }

    statsDiv.innerHTML = metrics.map(function (m) {
      return '<div class="model-stat-item"><div class="model-stat-value">' + m.value + '</div><div class="model-stat-label">' + m.label + '</div></div>';
    }).join('');
  }

  function runSimulation() {
    var n = parseInt(document.getElementById('sim-n').value) || 100;
    var reps = parseInt(document.getElementById('sim-reps').value) || 500;
    var trueBeta = parseFloat(document.getElementById('sim-beta').value) || 1.5;

    var betas = [];
    var seed = 999;
    for (var r = 0; r < reps; r++) {
      var rng = lcg(seed + r);
      var X = [];
      var y = [];
      for (var i = 0; i < n; i++) {
        var xi = randn(rng);
        X.push([1, xi]);
        y.push(trueBeta * xi + randn(rng));
      }
      var res = ols(X, y, false);
      betas.push(res.beta[1]); // slope coefficient
    }

    var simResultsCard = document.getElementById('sim-results-card');
    simResultsCard.style.display = 'block';

    var chartDiv = document.getElementById('sim-chart');
    var chartData = generateSimChart(betas);
    var chartLayout = plotlyLayout('Monte Carlo: Distribution of Beta Estimates', 'Beta Estimate', 'Frequency');
    // Add true value line
    chartData.push({
      x: [trueBeta, trueBeta],
      y: [0, reps * 0.06],
      type: 'scatter',
      mode: 'lines',
      line: { color: '#f85149', width: 2, dash: 'dash' },
      name: 'True Beta = ' + trueBeta,
    });
    Plotly.newPlot(chartDiv, chartData, chartLayout, { responsive: true, displayModeBar: false });

    // Stats
    var bMean = mean(betas);
    var bStd = std(betas);
    var bias = bMean - trueBeta;
    var statsDiv = document.getElementById('sim-stats');
    statsDiv.innerHTML = [
      { value: formatNum(bMean, 4), label: 'Mean Estimate' },
      { value: formatNum(bias, 4), label: 'Bias' },
      { value: formatNum(bStd, 4), label: 'Std. Deviation' },
      { value: formatNum(Math.sqrt((bStd * bStd + bias * bias)), 4), label: 'RMSE' },
      { value: reps, label: 'Repetitions' },
      { value: n, label: 'Sample Size' },
    ].map(function (m) {
      return '<div class="model-stat-item"><div class="model-stat-value">' + m.value + '</div><div class="model-stat-label">' + m.label + '</div></div>';
    }).join('');
  }

  // =========================================================================
  // Event Listeners
  // =========================================================================

  document.addEventListener('DOMContentLoaded', function () {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.preventDefault();
        var section = this.getAttribute('data-section');
        showSection(section);
      });
    });

    // Model selector changes
    document.getElementById('model-select').addEventListener('change', function () {
      showModelParams(this.value);
      document.getElementById('results-card').style.display = 'none';
    });

    // Dataset selector changes
    document.getElementById('dataset-select').addEventListener('change', function () {
      document.getElementById('results-card').style.display = 'none';
    });

    // Run model button
    document.getElementById('btn-run-model').addEventListener('click', function () {
      var inputs = getModelInputs();
      var result = estimateModel(inputs);
      if (result) {
        displayResults(result);
        showSection('dashboard');
      } else {
        alert('Model estimation failed. Please check your inputs.');
      }
    });

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', function () {
      document.getElementById('results-card').style.display = 'none';
    });

    // Run simulation
    document.getElementById('btn-run-sim').addEventListener('click', function () {
      runSimulation();
    });
  });

})();
