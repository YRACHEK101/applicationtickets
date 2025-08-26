const axios = require('axios');
const fs = require('fs');
const path = require('path');
// Ajout du polyfill pour Blob dans Node.js
global.Blob = require('blob');
const htmlDocx = require('html-docx-js');
const htmlPdf = require('html-pdf-node');

// Config
const SONAR_URL = process.env.SONAR_HOST_URL;
const SONAR_TOKEN = process.env.SONAR_TOKEN;
const PROJECT_KEY = 'ApplicationTicketClient';
const OUTPUT_DIR = path.join(__dirname, '../output');

// Assure-toi que le dossier output existe
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Auth pour Sonar
const authHeader = {
  headers: {
    Authorization: 'Basic ' + Buffer.from(SONAR_TOKEN + ':').toString('base64')
  }
};

// Récupérer les mesures de qualité étendues
async function getSonarMetrics() {
  const metrics = [
    'ncloc', 'complexity', 'violations', 'coverage', 'duplicated_lines_density',
    'bugs', 'code_smells', 'vulnerabilities', 'reliability_rating', 'security_rating',
    'sqale_index', 'sqale_debt_ratio', 'security_hotspots', 'tests', 'test_success_density',
    'lines_to_cover', 'uncovered_lines', 'duplicated_blocks', 'comment_lines_density'
  ];

  const res = await axios.get(`${SONAR_URL}/api/measures/component`, {
    ...authHeader,
    params: {
      component: PROJECT_KEY,
      metricKeys: metrics.join(',')
    }
  });

  const data = res.data.component.measures.reduce((acc, m) => {
    acc[m.metric] = m.value;
    return acc;
  }, {});

  return data;
}

// Récupérer les problèmes (issues) de SonarQube
async function getSonarIssues() {
  const issues = [];
  let page = 1;
  let pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    const res = await axios.get(`${SONAR_URL}/api/issues/search`, {
      ...authHeader,
      params: {
        componentKeys: PROJECT_KEY,
        ps: pageSize,
        p: page
      }
    });

    issues.push(...res.data.issues);
    
    // Vérifier s'il y a plus de pages
    hasMore = res.data.paging.total > page * pageSize;
    page++;
    
    // Limite pour éviter trop de requêtes
    if (page > 5) break;
  }

  return issues;
}

// Récupérer les tendances historiques
async function getMetricsHistory() {
  const metrics = ['bugs', 'vulnerabilities', 'code_smells', 'coverage'];
  const from = new Date();
  from.setMonth(from.getMonth() - 2); // Données des 2 derniers mois
  
  const formattedFrom = from.toISOString().split('T')[0];
  
  try {
    const res = await axios.get(`${SONAR_URL}/api/measures/search_history`, {
      ...authHeader,
      params: {
        component: PROJECT_KEY,
        metrics: metrics.join(','),
        from: formattedFrom
      }
    });
    
    return res.data.measures;
  } catch (error) {
    console.warn('⚠️ Impossible de récupérer l\'historique des métriques:', error.message);
    return [];
  }
}

// Fonction pour convertir les notes (ratings) en lettres
function ratingToLetter(rating) {
  const ratings = {
    '1': 'A (Excellent)',
    '2': 'B (Bon)',
    '3': 'C (Acceptable)',
    '4': 'D (Faible)',
    '5': 'E (Critique)'
  };
  return ratings[rating] || 'Non évalué';
}

// Fonction pour formater les durées (dette technique)
function formatDuration(minutes) {
  if (!minutes) return '0';
  
  const days = Math.floor(minutes / (8 * 60));
  minutes = minutes % (8 * 60);
  const hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  
  let result = '';
  if (days > 0) result += `${days}j `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0) result += `${minutes}m`;
  
  return result.trim();
}

// Générer le code pour les graphiques
function generateChartScript(metricsHistory) {
  if (!metricsHistory || metricsHistory.length === 0) {
    return '<!-- Pas de données historiques disponibles -->';
  }
  
  // Extraire les dates et les valeurs pour chaque métrique
  const datasets = {};
  const allDates = new Set();
  
  metricsHistory.forEach(metric => {
    datasets[metric.metric] = {};
    
    metric.history.forEach(point => {
      allDates.add(point.date);
      datasets[metric.metric][point.date] = point.value;
    });
  });
  
  const sortedDates = Array.from(allDates).sort();
  
  // Préparer les données pour Chart.js
  const chartColors = {
    bugs: 'rgb(255, 99, 132)',
    vulnerabilities: 'rgb(255, 159, 64)',
    code_smells: 'rgb(255, 205, 86)',
    coverage: 'rgb(75, 192, 192)'
  };
  
  const chartDatasets = Object.keys(datasets).map(metric => {
    return {
      label: metric,
      data: sortedDates.map(date => datasets[metric][date] || null),
      borderColor: chartColors[metric],
      fill: false
    };
  });
  
  return `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Graphique d'évolution des métriques
        const ctx1 = document.getElementById('metricsChart').getContext('2d');
        new Chart(ctx1, {
          type: 'line',
          data: {
            labels: ${JSON.stringify(sortedDates)},
            datasets: ${JSON.stringify(chartDatasets)}
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Évolution des métriques'
              }
            }
          }
        });
        
        // Graphique de répartition des problèmes
        const ctx2 = document.getElementById('issuesChart').getContext('2d');
        new Chart(ctx2, {
          type: 'pie',
          data: {
            labels: ['Bugs', 'Vulnérabilités', 'Code Smells'],
            datasets: [{
              data: [${datasets.bugs ? Object.values(datasets.bugs).pop() || 0 : 0}, 
                    ${datasets.vulnerabilities ? Object.values(datasets.vulnerabilities).pop() || 0 : 0}, 
                    ${datasets.code_smells ? Object.values(datasets.code_smells).pop() || 0 : 0}],
              backgroundColor: [
                'rgb(255, 99, 132)',
                'rgb(255, 159, 64)',
                'rgb(255, 205, 86)'
              ]
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Répartition des problèmes'
              }
            }
          }
        });
        
        // Graphique de couverture de code
        const ctx3 = document.getElementById('coverageChart').getContext('2d');
        const coverageValue = ${datasets.coverage ? Object.values(datasets.coverage).pop() || 0 : 0};
        new Chart(ctx3, {
          type: 'doughnut',
          data: {
            labels: ['Couvert', 'Non couvert'],
            datasets: [{
              data: [coverageValue, 100 - coverageValue],
              backgroundColor: [
                'rgb(75, 192, 192)',
                'rgb(201, 203, 207)'
              ]
            }]
          },
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Couverture de code'
              }
            }
          }
        });
      });
    </script>
  `;
}

// Générer HTML amélioré avec graphiques et analyses détaillées
function generateEnhancedHtmlReport(metrics, issues, metricsHistory) {
  // Analyser les issues pour obtenir des statistiques
  const issuesByType = issues.reduce((acc, issue) => {
    acc[issue.type] = (acc[issue.type] || 0) + 1;
    return acc;
  }, {});
  
  const issuesBySeverity = issues.reduce((acc, issue) => {
    acc[issue.severity] = (acc[issue.severity] || 0) + 1;
    return acc;
  }, {});
  
  // Identifier les fichiers les plus problématiques
  const fileIssues = {};
  issues.forEach(issue => {
    const component = issue.component.split(':').pop(); // Obtenir juste le nom du fichier
    fileIssues[component] = (fileIssues[component] || 0) + 1;
  });
  
  // Trier et obtenir le top 10
  const topProblematicFiles = Object.entries(fileIssues)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Générer des classes CSS conditionnelles pour le styling selon la valeur des métriques
  const getQualityClass = (metric, value) => {
    if (!value) return 'na';
    
    if (metric === 'bugs' || metric === 'vulnerabilities') {
      return parseInt(value) === 0 ? 'excellent' : 
             parseInt(value) <= 3 ? 'good' : 
             parseInt(value) <= 10 ? 'warning' : 'critical';
    }
    
    if (metric === 'code_smells') {
      return parseInt(value) <= 50 ? 'excellent' : 
             parseInt(value) <= 200 ? 'good' : 
             parseInt(value) <= 500 ? 'warning' : 'critical';
    }
    
    if (metric === 'coverage') {
      return parseFloat(value) >= 80 ? 'excellent' : 
             parseFloat(value) >= 60 ? 'good' : 
             parseFloat(value) >= 40 ? 'warning' : 'critical';
    }
    
    return 'na';
  };
  
  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport SonarQube Détaillé - ${PROJECT_KEY}</title>
    <style>
      :root {
        --primary: #0078d7;
        --success: #4caf50;
        --warning: #ff9800;
        --danger: #f44336;
        --light: #f9f9f9;
        --dark: #333;
        --border: #ddd;
      }
      body { 
        font-family: 'Segoe UI', Arial, sans-serif; 
        line-height: 1.6;
        color: var(--dark);
        background-color: #f5f5f5;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        background-color: white;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
      }
      header {
        background-color: var(--primary);
        color: white;
        padding: 20px;
        text-align: center;
        margin-bottom: 30px;
      }
      h1 { 
        margin: 0;
        font-size: 2em;
      }
      h2 {
        color: var(--primary);
        border-bottom: 2px solid var(--primary);
        padding-bottom: 10px;
        margin-top: 40px;
      }
      h3 {
        color: var(--dark);
        margin-top: 25px;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
        margin: 30px 0;
      }
      .metric-card {
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        transition: transform 0.3s ease;
      }
      .metric-card:hover {
        transform: translateY(-5px);
      }
      .metric-header {
        font-size: 1.2em;
        font-weight: bold;
        margin-bottom: 10px;
        color: var(--primary);
      }
      .metric-value {
        font-size: 2em;
        font-weight: bold;
        margin: 15px 0;
      }
      .metric-detail {
        color: #666;
        font-size: 0.9em;
      }
      .excellent { color: var(--success); }
      .good { color: #2196F3; }
      .warning { color: var(--warning); }
      .critical { color: var(--danger); }
      .na { color: #9e9e9e; }
      
      table { 
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      th, td { 
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid var(--border);
      }
      th { 
        background-color: var(--primary);
        color: white;
        font-weight: 600;
      }
      tr:nth-child(even) { background-color: var(--light); }
      tr:hover { background-color: rgba(0,120,215,0.05); }
      
      .chart-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
        gap: 20px;
        margin: 30px 0;
      }
      .chart-container {
        background-color: white;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        height: 350px;
      }
      
      .top-files {
        margin-top: 30px;
      }
      .file-item {
        display: flex;
        justify-content: space-between;
        padding: 10px 15px;
        border-bottom: 1px solid var(--border);
      }
      .file-item:last-child {
        border-bottom: none;
      }
      .file-name {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .file-issues {
        padding-left: 20px;
        font-weight: bold;
      }
      
      footer {
        margin-top: 50px;
        padding: 20px;
        text-align: center;
        color: #777;
        font-size: 0.9em;
        border-top: 1px solid var(--border);
      }
      
      @media print {
        body {
          background-color: white;
        }
        .container {
          box-shadow: none;
          max-width: 100%;
        }
        .chart-grid {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      
<!-- PAGE DE GARDE -->
<div style="page-break-after: always; text-align: center; padding-top: 100px;">
  <img src="logo-placeholder.png" alt="Logo Projet" style="max-height: 100px; margin-bottom: 30px;" />
  <h1 style="font-size: 3em; color: #0078d7;">Rapport de Qualité Logicielle</h1>
  <h2 style="color: #333;">Projet : ${PROJECT_KEY}</h2>
  <p style="margin-top: 50px; font-size: 1.2em;">Généré automatiquement via SonarQube</p>
  <p style="font-size: 1em; color: #777;">Date : ${new Date().toLocaleDateString()}</p>
</div>

<!-- TABLE DES MATIÈRES -->
<h2>Table des matières</h2>
<ol>
  <li><a href="#presentation">1. Présentation du Projet</a></li>
  <li><a href="#resume">2. Résumé de la qualité du code</a></li>
  <li><a href="#metriques">3. Métriques détaillées</a></li>
  <li><a href="#visualisation">4. Visualisation des données</a></li>
  <li><a href="#fichiers">5. Fichiers problématiques</a></li>
  <li><a href="#repartition">6. Répartition des problèmes</a></li>
  <li><a href="#conclusion">7. Conclusion</a></li>
</ol>

<!-- SECTION PRÉSENTATION -->
<h2 id="presentation">1. Présentation du Projet</h2>
<p>
  Le projet <strong>${PROJECT_KEY}</strong> est une application web full-stack développée en utilisant les technologies 
  MongoDB, Express.js, React.js et Node.js. Ce rapport a pour objectif d’analyser la qualité de code à travers différents 
  indicateurs mesurés automatiquement avec SonarQube.
</p>

<header>
        <h1>Rapport de Qualité - ${PROJECT_KEY}</h1>
        <p>Analyse de qualité du code générée le ${new Date().toLocaleString()}</p>
      </header>
      
      <h2>Résumé de la qualité du code</h2>
      <div class="summary-grid">
        <div class="metric-card">
          <div class="metric-header">Fiabilité</div>
          <div class="metric-value ${getQualityClass('bugs', metrics.bugs)}">${metrics.bugs || '0'}</div>
          <div class="metric-detail">Bugs détectés</div>
          <div class="metric-detail">Rating: ${metrics.reliability_rating ? ratingToLetter(metrics.reliability_rating) : 'Non disponible'}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-header">Sécurité</div>
          <div class="metric-value ${getQualityClass('vulnerabilities', metrics.vulnerabilities)}">${metrics.vulnerabilities || '0'}</div>
          <div class="metric-detail">Vulnérabilités</div>
          <div class="metric-detail">${metrics.security_hotspots || '0'} points sensibles identifiés</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-header">Maintenabilité</div>
          <div class="metric-value ${getQualityClass('code_smells', metrics.code_smells)}">${metrics.code_smells || '0'}</div>
          <div class="metric-detail">Code smells</div>
          <div class="metric-detail">Dette technique: ${formatDuration(metrics.sqale_index)}</div>
        </div>
        
        <div class="metric-card">
          <div class="metric-header">Couverture</div>
          <div class="metric-value ${getQualityClass('coverage', metrics.coverage)}">${parseFloat(metrics.coverage || 0).toFixed(1)}%</div>
          <div class="metric-detail">${metrics.lines_to_cover || '0'} lignes à couvrir</div>
          <div class="metric-detail">${metrics.uncovered_lines || '0'} lignes non couvertes</div>
        </div>
      </div>
      
      <h2>Métriques détaillées</h2>
      <table>
        <tr>
          <th>Métrique</th>
          <th>Valeur</th>
          <th>Description</th>
        </tr>
        <tr>
          <td>Taille du code</td>
          <td>${metrics.ncloc || '0'}</td>
          <td>Nombre de lignes de code (hors commentaires et espaces)</td>
        </tr>
        <tr>
          <td>Commentaires</td>
          <td>${metrics.comment_lines_density || '0'}%</td>
          <td>Densité de commentaires dans le code</td>
        </tr>
        <tr>
          <td>Complexité</td>
          <td>${metrics.complexity || '0'}</td>
          <td>Complexité cyclomatique totale du code</td>
        </tr>
        <tr>
          <td>Duplication</td>
          <td>${metrics.duplicated_lines_density || '0'}%</td>
          <td>${metrics.duplicated_blocks || '0'} blocs dupliqués identifiés</td>
        </tr>
        <tr>
          <td>Tests</td>
          <td>${metrics.tests || '0'}</td>
          <td>Taux de succès: ${metrics.test_success_density || '0'}%</td>
        </tr>
      </table>
      
      <h2>Visualisation des données</h2>
      <div class="chart-grid">
        <div class="chart-container">
          <canvas id="metricsChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="issuesChart"></canvas>
        </div>
        <div class="chart-container">
          <canvas id="coverageChart"></canvas>
        </div>
      </div>
      
      <h2>Top 10 des fichiers problématiques</h2>
      <div class="top-files">
        ${topProblematicFiles.length > 0 ? 
          topProblematicFiles.map(([file, count]) => `
            <div class="file-item">
              <div class="file-name">${file}</div>
              <div class="file-issues ${count > 10 ? 'critical' : count > 5 ? 'warning' : 'good'}">${count} problème${count > 1 ? 's' : ''}</div>
            </div>
          `).join('') : 
          '<p>Aucune donnée disponible sur les fichiers problématiques.</p>'
        }
      </div>
      
      <h2>Répartition des problèmes</h2>
      <div class="summary-grid">
        <div class="metric-card">
          <div class="metric-header">Par type</div>
          <table>
            <tr>
              <th>Type</th>
              <th>Nombre</th>
            </tr>
            ${Object.entries(issuesByType).length > 0 ? 
              Object.entries(issuesByType).map(([type, count]) => `
                <tr>
                  <td>${type}</td>
                  <td>${count}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="2">Aucune donnée disponible</td></tr>'
            }
          </table>
        </div>
        
        <div class="metric-card">
          <div class="metric-header">Par sévérité</div>
          <table>
            <tr>
              <th>Sévérité</th>
              <th>Nombre</th>
            </tr>
            ${Object.entries(issuesBySeverity).length > 0 ? 
              Object.entries(issuesBySeverity).map(([severity, count]) => `
                <tr>
                  <td>${severity}</td>
                  <td>${count}</td>
                </tr>
              `).join('') : 
              '<tr><td colspan="2">Aucune donnée disponible</td></tr>'
            }
          </table>
        </div>
      </div>
      
      
<h2 id="conclusion">7. Conclusion</h2>
<p>
  Cette analyse montre les forces et les faiblesses du projet <strong>${PROJECT_KEY}</strong>. Des efforts doivent être 
  concentrés sur la réduction des bugs critiques et l’amélioration de la couverture de tests, actuellement insuffisante.
</p>
<ul>
  <li>✅ Réduire les <strong>bugs (26)</strong> en priorité.</li>
  <li>🔐 Corriger les <strong>vulnérabilités de sécurité</strong>.</li>
  <li>🧹 Réduire les <strong>code smells</strong> et améliorer la lisibilité du code.</li>
  <li>🧪 Ajouter des tests unitaires pour atteindre au moins <strong>60% de couverture</strong>.</li>
</ul>

<footer>
        <p>Rapport SonarQube généré automatiquement par le pipeline CI/CD</p>
        <p>Date de génération: ${new Date().toLocaleString()}</p>
      </footer>
    </div>
    
    ${generateChartScript(metricsHistory)}
  </body>
  </html>
  `;
}

// Main
(async () => {
  try {
    // Récupérer toutes les données nécessaires
    console.log(' Récupération des métriques SonarQube...');
    const metrics = await getSonarMetrics();
    
    console.log(' Récupération des problèmes détectés...');
    const issues = await getSonarIssues();
    
    console.log(' Récupération de l\'historique des métriques...');
    const metricsHistory = await getMetricsHistory();
    
    console.log(' Génération du rapport détaillé...');
    const htmlContent = generateEnhancedHtmlReport(metrics, issues, metricsHistory);

    const htmlPath = path.join(OUTPUT_DIR, 'rapport-sonar.html');
    const pdfPath = path.join(OUTPUT_DIR, 'rapport-sonar.pdf');
    
    // Enregistrer HTML
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`✅ Rapport HTML détaillé généré (${htmlPath})`);

    // Tentative d'enregistrement DOCX si la bibliothèque le permet
    try {
      const docxPath = path.join(OUTPUT_DIR, 'rapport-sonar.docx');
      const simpleHtmlContent = `
        <html>
        <body>
          <h1>Rapport de Qualité - ${PROJECT_KEY}</h1>
          <p>Ce rapport est une version simplifiée. Pour une version complète avec graphiques, veuillez consulter le rapport PDF ou HTML.</p>
          <h2>Métriques clés</h2>
          <ul>
            <li>Bugs: ${metrics.bugs || '0'}</li>
            <li>Vulnérabilités: ${metrics.vulnerabilities || '0'}</li>
            <li>Code smells: ${metrics.code_smells || '0'}</li>
            <li>Couverture: ${metrics.coverage || '0'}%</li>
            <li>Duplication: ${metrics.duplicated_lines_density || '0'}%</li>
          </ul>
          <p>Généré le ${new Date().toLocaleString()}</p>
        </body>
        </html>
      `;
      
      try {
        const docxBlob = htmlDocx.asBlob(simpleHtmlContent);
        fs.writeFileSync(docxPath, Buffer.from(docxBlob));
        console.log(`✅ Rapport Word (.docx) simplifié généré (${docxPath})`);
      } catch (docxErr) {
        console.log('⚠️ Génération DOCX ignorée:', docxErr.message);
      }
    } catch (docxErr) {
      console.log('⚠️ Génération DOCX ignorée (incompatible avec cet environnement)');
    }

    // Enregistrer PDF
    const file = { content: htmlContent };
    const options = { 
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
      timeout: 30000 // Permettre le chargement complet des graphiques
    };
    
    const pdfBuffer = await htmlPdf.generatePdf(file, options);
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log(`✅ Rapport PDF détaillé généré (${pdfPath})`);
    
  } catch (err) {
    console.error('❌ Erreur génération rapport :', err.message);
    process.exit(1);
  }
})();