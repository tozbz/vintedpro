// ── DATA ──────────────────────────────────────────────────────────────────────
let ventes = JSON.parse(localStorage.getItem('vp_ventes') || '[]');
let stocks = JSON.parse(localStorage.getItem('vp_stocks') || '[]');

const NICHES_DATA = [
  { name: 'Groupes rock vintage', score: 95, tags: ['The Strokes', 'Arctic Monkeys', 'Radiohead'] },
  { name: 'Post-rock / Niche', score: 88, tags: ['Godspeed', 'Swans', 'Mogwai'] },
  { name: 'Kpop idols', score: 92, tags: ['BTS', 'Stray Kids', 'NewJeans'] },
  { name: 'Anime classics', score: 90, tags: ['Naruto', 'Dragon Ball', 'Eva'] },
  { name: 'Séries cultes', score: 85, tags: ['Breaking Bad', 'Sopranos', 'Twin Peaks'] },
  { name: 'F1 & Motorsport', score: 87, tags: ['Hamilton', 'Verstappen', 'Ferrari'] },
  { name: 'Gaming rétro', score: 83, tags: ['Nintendo', 'Zelda', 'PlayStation'] },
  { name: 'Rap français', score: 80, tags: ['PNL', 'Freeze Corleone', 'SCH'] },
  { name: 'Metal / Hardcore', score: 78, tags: ['Metallica', 'Tool', 'Slayer'] },
  { name: 'Y2K / 2000s pop', score: 82, tags: ['Britney', 'NSYNC', 'Destiny\'s Child'] },
  { name: 'Desperate Housewives', score: 76, tags: ['Séries ABC', 'Nostalgie 2000s'] },
  { name: 'Films cultes', score: 79, tags: ['Pulp Fiction', 'Fight Club', 'Matrix'] },
];

// ── PERSISTENCE ───────────────────────────────────────────────────────────────
function save() {
  localStorage.setItem('vp_ventes', JSON.stringify(ventes));
  localStorage.setItem('vp_stocks', JSON.stringify(stocks));
  updateDashboard();
  updateSidebarProgress();
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const page = btn.dataset.page;
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('page-' + page).classList.add('active');
    if (page === 'compta') renderCompta();
    if (page === 'niches') renderNiches();
    if (page === 'commandes') renderVentes();
    if (page === 'stock') renderStock();
  });
});

// ── TOAST ─────────────────────────────────────────────────────────────────────
function toast(msg, type = 'default') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  t.style.borderColor = type === 'success' ? 'rgba(34,197,94,0.4)' : type === 'error' ? 'rgba(239,68,68,0.4)' : '';
  setTimeout(() => t.style.display = 'none', 2800);
}

// ── UTILS ─────────────────────────────────────────────────────────────────────
function fmt(n) { return parseFloat(n).toFixed(2).replace('.', ',') + ' €'; }
function fmtN(n) { return parseFloat(n).toFixed(2).replace('.', ','); }
function currentMonth() { return new Date().getMonth(); }
function currentYear() { return new Date().getFullYear(); }
function parseDate(str) {
  const p = str.split('/');
  if (p.length === 3) return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  return null;
}
function isThisMonth(dateStr) {
  const d = parseDate(dateStr);
  if (!d) return false;
  return d.getMonth() === currentMonth() && d.getFullYear() === currentYear();
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function updateDashboard() {
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  const monthVentes = ventes.filter(v => isThisMonth(v.date));
  const revenu = monthVentes.reduce((s, v) => s + v.prix, 0);
  const marge = monthVentes.reduce((s, v) => s + v.marge, 0);
  const margePct = revenu > 0 ? Math.round((marge / revenu) * 100) : 0;
  const objPct = Math.min(Math.round((marge / 3000) * 100), 100);

  document.getElementById('kpi-revenu').textContent = fmt(revenu);
  document.getElementById('kpi-revenu-sub').textContent = monthVentes.length + ' vente' + (monthVentes.length > 1 ? 's' : '');
  document.getElementById('kpi-marge').textContent = fmt(marge);
  document.getElementById('kpi-marge-sub').textContent = margePct + '% de marge';
  document.getElementById('kpi-stock').textContent = stocks.reduce((s, st) => s + st.qty, 0);
  document.getElementById('kpi-obj').textContent = objPct + '%';
  document.getElementById('kpi-obj-sub').textContent = fmt(3000 - marge) + ' restants';

  // Last sales
  const lastEl = document.getElementById('dash-last-sales');
  if (!ventes.length) {
    lastEl.innerHTML = '<div class="empty"><i class="ti ti-shopping-cart-off"></i>Aucune vente enregistrée</div>';
  } else {
    lastEl.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Article</th><th>Vente</th><th>Marge</th><th>Statut</th></tr></thead><tbody>' +
      ventes.slice(0, 5).map(v => `<tr>
        <td>${v.date}</td>
        <td>${v.article}</td>
        <td style="color:var(--success);font-weight:500">${fmt(v.prix)}</td>
        <td style="font-weight:500;color:${v.marge >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(v.marge)}</td>
        <td>${statusBadge(v.statut)}</td>
      </tr>`).join('') + '</tbody></table></div>';
  }

  // Top niches
  const nicheMap = {};
  ventes.forEach(v => { if (v.niche) nicheMap[v.niche] = (nicheMap[v.niche] || 0) + 1; });
  const topNiches = Object.entries(nicheMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const nichesEl = document.getElementById('dash-top-niches');
  if (!topNiches.length) {
    nichesEl.innerHTML = '<div class="empty"><i class="ti ti-flame-off"></i>Pas encore de données</div>';
  } else {
    nichesEl.innerHTML = topNiches.map(([n, c]) =>
      `<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--border);font-size:13px">
        <span>${n}</span><span class="badge badge-accent">${c} vente${c > 1 ? 's' : ''}</span>
      </div>`).join('');
  }

  // Simulation
  const simEl = document.getElementById('dash-simulation');
  const remaining = Math.max(0, 3000 - marge);
  const daysLeft = new Date(currentYear(), currentMonth() + 1, 0).getDate() - new Date().getDate();
  const avgMarge = monthVentes.length > 0 ? marge / monthVentes.length : 8;
  const ventesNeeded = avgMarge > 0 ? Math.ceil(remaining / avgMarge) : '—';
  simEl.innerHTML = `<div style="font-size:13px;line-height:2;color:var(--text-secondary)">
    <div>Bénéfice ce mois : <strong style="color:var(--success)">${fmt(marge)}</strong></div>
    <div>Il reste : <strong>${fmt(remaining)}</strong> à générer</div>
    <div>Jours restants : <strong>${daysLeft} jours</strong></div>
    <div>Ventes nécessaires : <strong style="color:var(--accent)">${ventesNeeded}</strong></div>
  </div>`;
}

function updateSidebarProgress() {
  const monthVentes = ventes.filter(v => isThisMonth(v.date));
  const marge = monthVentes.reduce((s, v) => s + v.marge, 0);
  const pct = Math.min(Math.round((marge / 3000) * 100), 100);
  document.getElementById('sb-pct').textContent = pct + '%';
  document.getElementById('sb-fill').style.width = pct + '%';
}

// ── COMMANDES ─────────────────────────────────────────────────────────────────
document.querySelectorAll('#v-prix, #v-achat, #v-livraison').forEach(el => {
  el.addEventListener('input', previewMarge);
});

function previewMarge() {
  const prix = parseFloat(document.getElementById('v-prix').value) || 0;
  const achat = parseFloat(document.getElementById('v-achat').value) || 0;
  const liv = parseFloat(document.getElementById('v-livraison').value) || 0;
  const prev = document.getElementById('v-preview');
  if (!prix || !achat) { prev.style.display = 'none'; return; }
  const marge = prix - achat - liv - 0.5;
  const pct = Math.round((marge / prix) * 100);
  prev.style.display = 'block';
  prev.textContent = `Marge nette estimée : ${fmtN(marge)} € (${pct}%)`;
  prev.style.color = marge >= 5 ? 'var(--accent)' : 'var(--warning)';
  prev.style.borderColor = marge >= 5 ? 'var(--accent-border)' : 'rgba(245,158,11,0.3)';
  prev.style.background = marge >= 5 ? 'var(--accent-light)' : 'var(--warning-bg)';
}

function addVente() {
  const article = document.getElementById('v-article').value.trim();
  const niche = document.getElementById('v-niche').value.trim();
  const prix = parseFloat(document.getElementById('v-prix').value);
  const achat = parseFloat(document.getElementById('v-achat').value);
  const livraison = parseFloat(document.getElementById('v-livraison').value) || 0;
  const statut = document.getElementById('v-statut').value;

  if (!article) { toast('Indique le nom de l\'article', 'error'); return; }
  if (isNaN(prix) || isNaN(achat)) { toast('Remplis le prix de vente et d\'achat', 'error'); return; }

  const marge = parseFloat((prix - achat - livraison - 0.5).toFixed(2));
  const v = {
    id: Date.now(),
    date: new Date().toLocaleDateString('fr-FR'),
    article, niche, prix, achat, livraison, marge, statut
  };
  ventes.unshift(v);
  save();
  renderVentes();

  document.getElementById('v-article').value = '';
  document.getElementById('v-niche').value = '';
  document.getElementById('v-prix').value = '';
  document.getElementById('v-achat').value = '';
  document.getElementById('v-preview').style.display = 'none';
  toast('Vente enregistrée ✓', 'success');
}

function renderVentes() {
  const search = (document.getElementById('search-ventes')?.value || '').toLowerCase();
  const filtered = search ? ventes.filter(v =>
    v.article.toLowerCase().includes(search) || (v.niche || '').toLowerCase().includes(search)
  ) : ventes;

  document.getElementById('ventes-count').textContent = filtered.length + ' entrée' + (filtered.length > 1 ? 's' : '');

  const el = document.getElementById('ventes-table');
  if (!filtered.length) {
    el.innerHTML = '<div class="empty"><i class="ti ti-receipt-off"></i>' + (search ? 'Aucun résultat' : 'Aucune vente') + '</div>';
    return;
  }
  el.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Article</th><th>Niche</th><th>Vente</th><th>Achat</th><th>Livraison</th><th>Marge</th><th>Statut</th><th></th></tr></thead><tbody>' +
    filtered.map(v => `<tr>
      <td>${v.date}</td>
      <td style="font-weight:500">${v.article}</td>
      <td>${v.niche ? `<span class="tag">${v.niche}</span>` : '—'}</td>
      <td style="color:var(--success);font-weight:500">${fmt(v.prix)}</td>
      <td>${fmt(v.achat)}</td>
      <td>${fmt(v.livraison)}</td>
      <td style="font-weight:600;color:${v.marge >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(v.marge)}</td>
      <td>${statusBadge(v.statut)}</td>
      <td><button class="btn btn-danger" style="padding:4px 8px;font-size:11px" onclick="deleteVente(${v.id})"><i class="ti ti-trash"></i></button></td>
    </tr>`).join('') + '</tbody></table></div>';
}

function deleteVente(id) {
  if (!confirm('Supprimer cette vente ?')) return;
  ventes = ventes.filter(v => v.id !== id);
  save();
  renderVentes();
  toast('Vente supprimée');
}

function statusBadge(s) {
  const map = { 'Finalisé': 'badge-success', 'Expédié': 'badge-warning', 'Commandé Temu': 'badge-accent', 'À commander': 'badge-muted' };
  return `<span class="badge ${map[s] || 'badge-muted'}">${s}</span>`;
}

// ── STOCK ─────────────────────────────────────────────────────────────────────
function addStock() {
  const article = document.getElementById('s-article').value.trim();
  const niche = document.getElementById('s-niche').value.trim();
  const qty = parseInt(document.getElementById('s-qty').value) || 1;
  const prix = parseFloat(document.getElementById('s-prix').value);

  if (!article) { toast('Indique le nom de l\'article', 'error'); return; }
  if (isNaN(prix)) { toast('Indique le prix d\'achat', 'error'); return; }

  stocks.unshift({ id: Date.now(), article, niche, qty, prix });
  save();
  renderStock();
  document.getElementById('s-article').value = '';
  document.getElementById('s-niche').value = '';
  document.getElementById('s-qty').value = '1';
  document.getElementById('s-prix').value = '';
  toast('Stock mis à jour ✓', 'success');
}

function renderStock() {
  const valeurTotale = stocks.reduce((s, st) => s + st.qty * st.prix, 0);
  document.getElementById('stock-count').textContent = stocks.reduce((s, st) => s + st.qty, 0) + ' articles — valeur : ' + fmt(valeurTotale);
  const el = document.getElementById('stock-table');
  if (!stocks.length) {
    el.innerHTML = '<div class="empty"><i class="ti ti-box-off"></i>Stock vide</div>';
    return;
  }
  el.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Article</th><th>Niche</th><th>Qté</th><th>Prix unitaire</th><th>Valeur totale</th><th></th></tr></thead><tbody>' +
    stocks.map(s => `<tr>
      <td style="font-weight:500">${s.article}</td>
      <td>${s.niche ? `<span class="tag">${s.niche}</span>` : '—'}</td>
      <td style="font-weight:600">${s.qty}</td>
      <td>${fmt(s.prix)}</td>
      <td style="font-weight:500;color:var(--accent)">${fmt(s.qty * s.prix)}</td>
      <td><button class="btn btn-danger" style="padding:4px 8px;font-size:11px" onclick="deleteStock(${s.id})"><i class="ti ti-trash"></i></button></td>
    </tr>`).join('') + '</tbody></table></div>';
}

function deleteStock(id) {
  if (!confirm('Supprimer cet article du stock ?')) return;
  stocks = stocks.filter(s => s.id !== id);
  save();
  renderStock();
}

// ── MARGE ─────────────────────────────────────────────────────────────────────
function calcMarge() {
  const vente = parseFloat(document.getElementById('m-vente').value) || 0;
  const achat = parseFloat(document.getElementById('m-achat').value) || 0;
  const liv = parseFloat(document.getElementById('m-liv').value) || 0;
  const emb = parseFloat(document.getElementById('m-emb').value) || 0;
  if (!vente || !achat) return;

  const brut = vente - achat;
  const couts = achat + liv + emb;
  const nette = vente - couts;
  const pct = Math.round((nette / vente) * 100);

  document.getElementById('m-brut').textContent = fmt(brut);
  document.getElementById('m-couts').textContent = fmt(couts);
  document.getElementById('m-nette').textContent = fmt(nette);
  document.getElementById('m-nette').className = nette >= 0 ? 'success' : 'danger';
  document.getElementById('m-pct').textContent = pct + '%';

  const verdict = document.getElementById('m-verdict');
  if (pct >= 35) {
    verdict.textContent = '✓ Excellente marge — go !';
    verdict.style.background = 'var(--success-bg)';
    verdict.style.color = 'var(--success)';
  } else if (pct >= 20) {
    verdict.textContent = '⚠ Marge correcte — optimisable';
    verdict.style.background = 'var(--warning-bg)';
    verdict.style.color = 'var(--warning)';
  } else {
    verdict.textContent = '✗ Marge trop faible — ajuste le prix';
    verdict.style.background = 'var(--danger-bg)';
    verdict.style.color = 'var(--danger)';
  }

  const ventesNecessaires = nette > 0 ? Math.ceil(3000 / nette) : '—';
  const parJour = typeof ventesNecessaires === 'number' ? Math.ceil(ventesNecessaires / 30) : '—';
  document.getElementById('m-simulation').innerHTML = `
    <div style="font-size:13px;line-height:2;color:var(--text-secondary)">
      <div>Marge nette par vente : <strong style="color:var(--success)">${fmt(nette)}</strong></div>
      <div>Ventes pour 3000€/mois : <strong style="color:var(--accent)">${ventesNecessaires}</strong></div>
      <div>Soit par jour : <strong>${parJour} ventes/jour</strong></div>
      <div style="margin-top:8px;color:var(--text-muted);font-size:12px">
        ${typeof parJour === 'number' && parJour <= 5 ? '✓ Objectif atteignable en solo' : parJour <= 15 ? '⚠ Volume important, scale progressivement' : '✗ Augmente la marge ou diversifie les articles'}
      </div>
    </div>`;
}

// ── NICHES ────────────────────────────────────────────────────────────────────
function renderNiches() {
  const nicheMap = {};
  ventes.forEach(v => { if (v.niche) nicheMap[v.niche] = (nicheMap[v.niche] || 0) + 1; });
  const topNiches = Object.entries(nicheMap).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const aiEl = document.getElementById('niche-ai-text');
  aiEl.textContent = topNiches.length
    ? 'Tes niches les plus vendues : ' + topNiches.map(([n, c]) => `${n} (${c} vente${c > 1 ? 's' : ''})`).join(', ') + '. Concentre tes prochaines commandes dessus.'
    : 'Tes données apparaîtront ici après quelques ventes enregistrées.';

  document.getElementById('niche-grid').innerHTML = NICHES_DATA.map(n => `
    <div class="niche-card">
      <div class="niche-name">${n.name}</div>
      <div class="niche-score-label">Score ${n.score}/100</div>
      <div class="score-bar"><div class="score-fill" style="width:${n.score}%"></div></div>
      <div style="margin-top:6px">${n.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    </div>`).join('');
}

// ── ANNONCES IA ───────────────────────────────────────────────────────────────
async function genAnnonce() {
  const article = document.getElementById('a-article').value.trim();
  const niche = document.getElementById('a-niche').value.trim();
  const taille = document.getElementById('a-taille').value;
  const etat = document.getElementById('a-etat').value;
  const prix = document.getElementById('a-prix').value;

  if (!article) { toast('Indique le nom de l\'article', 'error'); return; }

  const btn = document.getElementById('gen-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="ti ti-loader" style="animation:spin 1s linear infinite"></i> Génération...';

  const prompt = `Tu es un expert en vente sur Vinted. Génère une annonce Vinted optimisée et naturelle.

Article : ${article}
Univers : ${niche || 'mode vintage'}
Taille : ${taille}
État : ${etat}
Prix : ${prix ? prix + '€' : 'non précisé'}

Génère :
TITRE: [titre accrocheur max 60 caractères, naturel, sans majuscules excessives]
DESCRIPTION: [3-4 lignes naturelles et vendeuses, comme si c'était une vraie personne qui vend]
TAGS: [#tag1 #tag2 #tag3 #tag4 #tag5]

Réponds uniquement avec ces 3 blocs, rien d'autre.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await res.json();
    const text = data.content[0].text;
    const titre = text.match(/TITRE:\s*(.+)/)?.[1]?.trim() || article;
    const desc = text.match(/DESCRIPTION:\s*([\s\S]+?)(?=TAGS:|$)/)?.[1]?.trim() || '';
    const tags = text.match(/TAGS:\s*(.+)/)?.[1]?.trim() || '';

    document.getElementById('annonce-titre').textContent = titre;
    document.getElementById('annonce-desc').textContent = desc;
    document.getElementById('annonce-tags').innerHTML = tags.split(' ')
      .filter(t => t.startsWith('#'))
      .map(t => `<span class="tag">${t}</span>`).join('');
    document.getElementById('annonce-result').style.display = 'block';
    toast('Annonce générée ✓', 'success');
  } catch (e) {
    toast('Erreur lors de la génération', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="ti ti-sparkles"></i> Générer l\'annonce';
}

function copyAnnonce() {
  const titre = document.getElementById('annonce-titre').textContent;
  const desc = document.getElementById('annonce-desc').textContent;
  const tags = Array.from(document.getElementById('annonce-tags').querySelectorAll('.tag'))
    .map(t => t.textContent).join(' ');
  navigator.clipboard.writeText(`${titre}\n\n${desc}\n\n${tags}`);
  toast('Copié dans le presse-papiers ✓', 'success');
}

// ── COMPTA ────────────────────────────────────────────────────────────────────
function renderCompta() {
  const filtre = document.getElementById('compta-filtre')?.value || 'all';
  const filtered = filtre === 'month' ? ventes.filter(v => isThisMonth(v.date)) : ventes;

  const totalVentes = filtered.reduce((s, v) => s + v.prix, 0);
  const totalCouts = filtered.reduce((s, v) => s + v.achat + v.livraison, 0);
  const totalMarge = filtered.reduce((s, v) => s + v.marge, 0);
  const margePct = totalVentes > 0 ? Math.round((totalMarge / totalVentes) * 100) : 0;

  document.getElementById('compta-kpis').innerHTML = `
    <div class="kpi"><div class="kpi-label">Chiffre d'affaires</div><div class="kpi-value">${fmt(totalVentes)}</div></div>
    <div class="kpi"><div class="kpi-label">Coûts totaux</div><div class="kpi-value">${fmt(totalCouts)}</div></div>
    <div class="kpi"><div class="kpi-label">Bénéfice net</div><div class="kpi-value success">${fmt(totalMarge)}</div></div>
    <div class="kpi"><div class="kpi-label">Marge moyenne</div><div class="kpi-value accent">${margePct}%</div></div>
  `;

  const el = document.getElementById('compta-table');
  if (!filtered.length) {
    el.innerHTML = '<div class="empty"><i class="ti ti-report-off"></i>Aucune transaction</div>';
    return;
  }
  el.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Article</th><th>Niche</th><th>CA</th><th>Coûts</th><th>Bénéfice</th><th>%</th></tr></thead><tbody>' +
    filtered.map(v => {
      const cout = v.achat + v.livraison;
      const p = v.prix > 0 ? Math.round((v.marge / v.prix) * 100) : 0;
      return `<tr>
        <td>${v.date}</td>
        <td>${v.article}</td>
        <td>${v.niche ? `<span class="tag">${v.niche}</span>` : '—'}</td>
        <td style="color:var(--success)">${fmt(v.prix)}</td>
        <td>${fmt(cout)}</td>
        <td style="font-weight:600;color:${v.marge >= 0 ? 'var(--success)' : 'var(--danger)'}">${fmt(v.marge)}</td>
        <td><span class="badge ${p >= 35 ? 'badge-success' : p >= 20 ? 'badge-accent' : 'badge-muted'}">${p}%</span></td>
      </tr>`;
    }).join('') + '</tbody></table></div>';
}

function exportCSV() {
  if (!ventes.length) { toast('Aucune donnée à exporter', 'error'); return; }
  const rows = ['Date,Article,Niche,Prix vente,Prix achat,Livraison,Marge nette,Statut',
    ...ventes.map(v => `${v.date},"${v.article}","${v.niche || ''}",${v.prix},${v.achat},${v.livraison},${v.marge},${v.statut}`)
  ];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vintedpro-compta-${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Export CSV téléchargé ✓', 'success');
}

// ── CSS ANIMATION ─────────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }';
document.head.appendChild(style);

// ── INIT ──────────────────────────────────────────────────────────────────────
updateDashboard();
updateSidebarProgress();
renderVentes();
renderStock();
