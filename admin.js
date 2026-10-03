/**
 * ============================================================================
 * PKSK ADMIN & LICENSE MONITOR DASHBOARD (JAVASCRIPT CONTROLLER)
 * ============================================================================
 * Menguruskan pemantauan masa nyata 500+ kunci lesen PKSK melalui Supabase,
 * salinan pantas, tetapan semula peranti (reset), sekatan (block), pelanjutan
 * tempoh (extend), dan penjanaan kunci baharu secara kelompok.
 */

(function () {
  'use strict';

  // Konfigurasi Default Supabase
  const DEFAULT_SUPABASE_URL = 'https://lcfkvljmcamulshvyeqe.supabase.co';
  const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjZmt2bGptY2FtdWxzaHZ5ZXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0NTc3ODYsImV4cCI6MjEwNjAzMzc4Nn0.bDAu2Inge2D53_zDeaI37mpEfMNcQYJraXxoVfoc1pc';

  const STORAGE_KEY_URL = 'pksk_admin_supabase_url';
  const STORAGE_KEY_KEY = 'pksk_admin_supabase_key';
  
  // Kata Laluan Keselamatan Pentadbir PKSK
  const ADMIN_PASSWORD = '@reeZ860';
  const STORAGE_KEY_AUTH = 'pksk_admin_auth_session';

  function getSupabaseConfig() {
    let url = localStorage.getItem(STORAGE_KEY_URL);
    // Perlindungan Auto-Migrasi: Kosongkan URL projek lama yang telah pupus
    if (!url || url.includes("rvslrscgbhgdcktdtfrl") || url.includes("zblynieuimcxkkaaqaxy")) {
      url = DEFAULT_SUPABASE_URL;
      localStorage.setItem(STORAGE_KEY_URL, DEFAULT_SUPABASE_URL);
      localStorage.setItem(STORAGE_KEY_KEY, DEFAULT_SUPABASE_KEY);
    }
    const key = localStorage.getItem(STORAGE_KEY_KEY) || DEFAULT_SUPABASE_KEY;
    return { url, key };
  }

  // State Pengurusan
  const state = {
    allLicenses: [],
    filteredLicenses: [],
    currentStatusFilter: 'ALL',
    searchQuery: '',
    currentPage: 1,
    pageSize: 25,
    selectedLicense: null,
    isLoading: false
  };

  // DOM Cache
  const dom = {
    // Login Gate Lock Screen
    loginGateOverlay: document.getElementById('loginGateOverlay'),
    loginGateForm: document.getElementById('loginGateForm'),
    loginPasswordInput: document.getElementById('loginPasswordInput'),
    btnToggleLoginPass: document.getElementById('btnToggleLoginPass'),
    eyeIcon: document.getElementById('eyeIcon'),
    loginErrorMsg: document.getElementById('loginErrorMsg'),
    btnLogoutAdmin: document.getElementById('btnLogoutAdmin'),

    // Stats & Allocation Rail
    statTotalKeys: document.getElementById('statTotalKeys'),
    statActiveKeys: document.getElementById('statActiveKeys'),
    statUsedKeys: document.getElementById('statUsedKeys'),
    statExpiredKeys: document.getElementById('statExpiredKeys'),
    statBlockedKeys: document.getElementById('statBlockedKeys'),
    railSegActive: document.getElementById('railSegActive'),
    railSegUsed: document.getElementById('railSegUsed'),
    railSegExpired: document.getElementById('railSegExpired'),
    railSegBlocked: document.getElementById('railSegBlocked'),

    // Filter & Toolbar
    inputSearch: document.getElementById('inputSearch'),
    filterPills: document.querySelectorAll('.filter-pill'),
    pillCountAll: document.getElementById('pillCountAll'),
    pillCountActive: document.getElementById('pillCountActive'),
    pillCountUsed: document.getElementById('pillCountUsed'),
    pillCountExpired: document.getElementById('pillCountExpired'),
    pillCountBlocked: document.getElementById('pillCountBlocked'),
    dispShownCount: document.getElementById('dispShownCount'),
    dispTotalFilteredCount: document.getElementById('dispTotalFilteredCount'),
    btnRefreshData: document.getElementById('btnRefreshData'),
    btnExportCsv: document.getElementById('btnExportCsv'),
    btnCopyNextAvailable: document.getElementById('btnCopyNextAvailable'),
    btnCopyBatchAvailable: document.getElementById('btnCopyBatchAvailable'),

    // Shopee Quick Assign & Message Modal
    btnQuickShopeeAssign: document.getElementById('btnQuickShopeeAssign'),
    btnQuickShopeeAssignBanner: document.getElementById('btnQuickShopeeAssignBanner'),
    modalShopeeMessage: document.getElementById('modalShopeeMessage'),
    btnCloseShopeeModal: document.getElementById('btnCloseShopeeModal'),
    btnCancelShopeeModal: document.getElementById('btnCancelShopeeModal'),
    shopeeModalKey: document.getElementById('shopeeModalKey'),
    btnCopyOnlyKey: document.getElementById('btnCopyOnlyKey'),
    shopeeModalBuyer: document.getElementById('shopeeModalBuyer'),
    shopeeModalOrder: document.getElementById('shopeeModalOrder'),
    shopeeModalUrl: document.getElementById('shopeeModalUrl'),
    shopeeMessagePreview: document.getElementById('shopeeMessagePreview'),
    btnCopyShopeeMessageOnly: document.getElementById('btnCopyShopeeMessageOnly'),
    btnSaveAndCopyShopeeMessage: document.getElementById('btnSaveAndCopyShopeeMessage'),

    // Table & Pagination
    licenseTableBody: document.getElementById('licenseTableBody'),
    paginationWrap: document.getElementById('paginationWrap'),
    dispCurrentPage: document.getElementById('dispCurrentPage'),
    dispTotalPages: document.getElementById('dispTotalPages'),

    // Manage Modal
    modalManageLicense: document.getElementById('modalManageLicense'),
    btnCloseManageModal: document.getElementById('btnCloseManageModal'),
    btnCancelManage: document.getElementById('btnCancelManage'),
    modalDispKey: document.getElementById('modalDispKey'),
    modalDispStatusBadge: document.getElementById('modalDispStatusBadge'),
    modalInputName: document.getElementById('modalInputName'),
    modalInputIc: document.getElementById('modalInputIc'),
    modalInputDeviceId: document.getElementById('modalInputDeviceId'),
    modalInputExpiresAt: document.getElementById('modalInputExpiresAt'),
    btnQuickAdd30d: document.getElementById('btnQuickAdd30d'),
    btnQuickAdd180d: document.getElementById('btnQuickAdd180d'),
    btnQuickAdd365d: document.getElementById('btnQuickAdd365d'),
    btnModalResetKey: document.getElementById('btnModalResetKey'),
    btnModalToggleBlock: document.getElementById('btnModalToggleBlock'),
    btnSaveLicenseChanges: document.getElementById('btnSaveLicenseChanges'),

    // Generate Modal
    modalGenerateKeys: document.getElementById('modalGenerateKeys'),
    btnOpenGenerateModal: document.getElementById('btnOpenGenerateModal'),
    btnCloseGenModal: document.getElementById('btnCloseGenModal'),
    btnCancelGen: document.getElementById('btnCancelGen'),
    selectGenQuantity: document.getElementById('selectGenQuantity'),
    inputGenTier: document.getElementById('inputGenTier'),
    btnExecuteGenerate: document.getElementById('btnExecuteGenerate'),
    genResultBox: document.getElementById('genResultBox'),

    // Config Modal
    modalConfig: document.getElementById('modalConfig'),
    btnOpenConfigModal: document.getElementById('btnOpenConfigModal'),
    btnCloseConfigModal: document.getElementById('btnCloseConfigModal'),
    btnCancelConfig: document.getElementById('btnCancelConfig'),
    cfgSupabaseUrl: document.getElementById('cfgSupabaseUrl'),
    cfgSupabaseKey: document.getElementById('cfgSupabaseKey'),
    btnSaveConfig: document.getElementById('btnSaveConfig'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
  };

  /* =========================================================================
     TOAST HELPER
     ========================================================================= */
  function showToast(message, type = 'success', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;

    let icon = '<i class="fa-solid fa-circle-check" style="color:var(--accent-emerald);"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-circle-exclamation" style="color:var(--accent-rose);"></i>';
    if (type === 'info') icon = '<i class="fa-solid fa-info-circle" style="color:var(--accent-blue);"></i>';

    toast.innerHTML = `${icon} <span>${message}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /* =========================================================================
     SUPABASE REST API OPERATIONS
     ========================================================================= */
  async function fetchAllLicensesFromSupabase() {
    state.isLoading = true;
    const config = getSupabaseConfig();

    dom.licenseTableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted);">
          <i class="fa-solid fa-circle-notch fa-spin fa-2x" style="margin-bottom:0.75rem; color:var(--accent-blue);"></i><br>
          Sedang memuat data kunci dari Supabase...
        </td>
      </tr>
    `;

    try {
      // Dapatkan semua kunci (limit 1000)
      const endpoint = `${config.url}/rest/v1/pksk_licenses?select=*&order=created_at.asc&limit=1000`;
      const res = await fetch(endpoint, {
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error(`Ralat pelayan (${res.status}): Sila semak Project URL / Anon Key.`);
      }

      const data = await res.json();
      state.allLicenses = data || [];
      state.isLoading = false;

      updateStats();
      applyFiltersAndSearch();
      showToast(`Berjaya memuat ${state.allLicenses.length} kunci lesen dari Supabase!`, 'success');

    } catch (err) {
      state.isLoading = false;
      console.error('Fetch error:', err);
      dom.licenseTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:3rem; color:#fb7185;">
            <i class="fa-solid fa-triangle-exclamation fa-2x" style="margin-bottom:0.75rem;"></i><br>
            <strong>Gagal menyambung ke Supabase:</strong> ${err.message}<br>
            <button id="btnRetryFetch" class="btn-admin btn-outline btn-sm" style="margin-top:1rem;">
              <i class="fa-solid fa-rotate-right"></i> Cuba Semula
            </button>
          </td>
        </tr>
      `;
      const retryBtn = document.getElementById('btnRetryFetch');
      if (retryBtn) retryBtn.onclick = fetchAllLicensesFromSupabase;
      showToast(err.message, 'error', 5000);
    }
  }

  async function updateLicenseInSupabase(licenseKey, updateFields) {
    const config = getSupabaseConfig();
    const endpoint = `${config.url}/rest/v1/pksk_licenses?license_key=eq.${encodeURIComponent(licenseKey)}`;

    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateFields)
    });

    if (!res.ok) {
      throw new Error(`Gagal mengemaskini Supabase (${res.status}).`);
    }

    const updatedRows = await res.json();
    return updatedRows && updatedRows[0] ? updatedRows[0] : null;
  }

  async function insertLicensesToSupabase(newLicenseRecords) {
    const config = getSupabaseConfig();
    const endpoint = `${config.url}/rest/v1/pksk_licenses`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'apikey': config.key,
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(newLicenseRecords)
    });

    if (!res.ok) {
      throw new Error(`Gagal menyimpan kunci baharu ke Supabase (${res.status}).`);
    }

    return await res.json();
  }

  /* =========================================================================
     STATS CALCULATION
     ========================================================================= */
  function updateStats() {
    const total = state.allLicenses.length;
    let countActive = 0;
    let countUsed = 0;
    let countExpired = 0;
    let countBlocked = 0;

    const now = Date.now();

    state.allLicenses.forEach(lic => {
      const isExpired = lic.expires_at && new Date(lic.expires_at).getTime() < now;

      if (lic.status === 'BLOCKED') {
        countBlocked++;
      } else if (isExpired || lic.status === 'EXPIRED') {
        countExpired++;
      } else if (lic.status === 'USED') {
        countUsed++;
      } else if (lic.status === 'ACTIVE') {
        countActive++;
      }
    });

    dom.statTotalKeys.textContent = total.toLocaleString();
    dom.statActiveKeys.textContent = countActive.toLocaleString();
    dom.statUsedKeys.textContent = countUsed.toLocaleString();
    dom.statExpiredKeys.textContent = countExpired.toLocaleString();
    dom.statBlockedKeys.textContent = countBlocked.toLocaleString();

    dom.pillCountAll.textContent = total;
    dom.pillCountActive.textContent = countActive;
    dom.pillCountUsed.textContent = countUsed;
    dom.pillCountExpired.textContent = countExpired;
    dom.pillCountBlocked.textContent = countBlocked;

    if (total > 0) {
      if (dom.railSegActive) dom.railSegActive.style.width = ((countActive / total) * 100).toFixed(1) + '%';
      if (dom.railSegUsed) dom.railSegUsed.style.width = ((countUsed / total) * 100).toFixed(1) + '%';
      if (dom.railSegExpired) dom.railSegExpired.style.width = ((countExpired / total) * 100).toFixed(1) + '%';
      if (dom.railSegBlocked) dom.railSegBlocked.style.width = ((countBlocked / total) * 100).toFixed(1) + '%';
    }
  }

  /* =========================================================================
     SEARCH & FILTERING
     ========================================================================= */
  function applyFiltersAndSearch() {
    const query = state.searchQuery.trim().toLowerCase();
    const statusFilter = state.currentStatusFilter;
    const now = Date.now();

    state.filteredLicenses = state.allLicenses.filter(lic => {
      // 1. Status Filter
      const isExpired = lic.expires_at && new Date(lic.expires_at).getTime() < now;
      let effectiveStatus = lic.status;
      if (lic.status !== 'BLOCKED' && isExpired) effectiveStatus = 'EXPIRED';

      if (statusFilter !== 'ALL' && effectiveStatus !== statusFilter) {
        return false;
      }

      // 2. Search Query
      if (query) {
        const keyMatch = lic.license_key?.toLowerCase().includes(query);
        const nameMatch = lic.activated_by_name?.toLowerCase().includes(query);
        const icMatch = lic.activated_by_ic?.toLowerCase().includes(query);
        const deviceMatch = lic.device_id?.toLowerCase().includes(query);
        if (!keyMatch && !nameMatch && !icMatch && !deviceMatch) {
          return false;
        }
      }

      return true;
    });

    state.currentPage = 1;
    renderTable();
  }

  /* =========================================================================
     TABLE RENDERING
     ========================================================================= */
  function renderTable() {
    const totalFiltered = state.filteredLicenses.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / state.pageSize));
    if (state.currentPage > totalPages) state.currentPage = totalPages;

    const startIdx = (state.currentPage - 1) * state.pageSize;
    const endIdx = startIdx + state.pageSize;
    const pageItems = state.filteredLicenses.slice(startIdx, endIdx);

    dom.dispShownCount.textContent = pageItems.length;
    dom.dispTotalFilteredCount.textContent = totalFiltered;
    dom.dispCurrentPage.textContent = state.currentPage;
    dom.dispTotalPages.textContent = totalPages;

    if (pageItems.length === 0) {
      dom.licenseTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:3rem; color:var(--text-muted);">
            <i class="fa-solid fa-magnifying-glass fa-2x" style="margin-bottom:0.75rem; color:var(--text-subtle);"></i><br>
            Tiada rekod kunci lesen dijumpai mengikut tapisan semasa.
          </td>
        </tr>
      `;
      renderPagination(totalPages);
      return;
    }

    const now = Date.now();

    dom.licenseTableBody.innerHTML = pageItems.map((lic, index) => {
      const rowNum = startIdx + index + 1;
      const isExpired = lic.expires_at && new Date(lic.expires_at).getTime() < now;
      let effectiveStatus = lic.status;
      if (lic.status !== 'BLOCKED' && isExpired) effectiveStatus = 'EXPIRED';

      let statusBadgeHtml = '';
      if (effectiveStatus === 'ACTIVE') {
        statusBadgeHtml = `<span class="status-badge active"><span class="status-dot"></span> Tersedia</span>`;
      } else if (effectiveStatus === 'USED') {
        statusBadgeHtml = `<span class="status-badge used"><span class="status-dot"></span> Diaktifkan</span>`;
      } else if (effectiveStatus === 'EXPIRED') {
        statusBadgeHtml = `<span class="status-badge expired"><span class="status-dot"></span> Tamat</span>`;
      } else if (effectiveStatus === 'BLOCKED') {
        statusBadgeHtml = `<span class="status-badge blocked"><span class="status-dot"></span> Disekat</span>`;
      }

      // Candidate info & Device limit (2 Peranti Hardware Fingerprint)
      let candidateInfo = '<span style="color:var(--text-subtle);">- Belum Digunakan -</span>';
      if (lic.activated_by_name || lic.activated_by_ic || lic.device_id) {
        const devs = lic.device_id ? String(lic.device_id).split(',').filter(Boolean) : [];
        const maxDevs = lic.max_devices || 2;
        const devCountBadge = `<span style="background:rgba(59,130,246,0.15); color:#60a5fa; font-size:0.72rem; font-weight:700; padding:1px 6px; border-radius:4px; margin-left:4px;">${devs.length}/${maxDevs} Peranti</span>`;

        const devPills = devs.map(d => `<span style="display:inline-block; font-family:var(--font-mono); font-size:0.68rem; padding:1px 5px; border-radius:3px; background:#0b1329; color:#38bdf8; border:1px solid rgba(56,189,248,0.2); margin-top:2px;" title="${d}">💻 ${d.length > 18 ? d.substring(0, 16) + '...' : d}</span>`).join(' ');

        candidateInfo = `
          <div style="font-weight:700; color:#fff; display:flex; align-items:center; gap:4px; flex-wrap:wrap;">
            ${lic.activated_by_name || 'Calon PKSK'}
            ${devCountBadge}
          </div>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">
            ${lic.activated_by_ic ? `<span>ID/IC: ${lic.activated_by_ic}</span>` : ''}
          </div>
          ${devs.length > 0 ? `<div style="margin-top:3px; display:flex; flex-wrap:wrap; gap:4px;">${devPills}</div>` : ''}
        `;
      }

      // Activation Date
      let activatedDate = '<span style="color:var(--text-subtle);">-</span>';
      if (lic.activated_at) {
        const d = new Date(lic.activated_at);
        activatedDate = `
          <div style="color:var(--text-main); font-weight:600;">${formatDateClean(d)}</div>
          <div style="font-size:0.75rem; color:var(--text-subtle);">${formatTimeClean(d)}</div>
        `;
      }

      // Expiry Date & Countdown
      let expiryInfo = '<span style="color:var(--text-subtle);">-</span>';
      if (lic.expires_at) {
        const exp = new Date(lic.expires_at);
        const diffMs = exp.getTime() - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let countdownBadge = '';
        if (diffDays > 0) {
          countdownBadge = `<span style="font-size:0.72rem; padding:1px 6px; border-radius:4px; background:rgba(16,185,129,0.15); color:#34d399; font-weight:700;">Baki ${diffDays} Hari</span>`;
        } else {
          countdownBadge = `<span style="font-size:0.72rem; padding:1px 6px; border-radius:4px; background:rgba(244,63,94,0.15); color:#fb7185; font-weight:700;">Telah Luput</span>`;
        }

        expiryInfo = `
          <div style="color:var(--text-main); font-weight:600; margin-bottom:2px;">${formatDateClean(exp)}</div>
          ${countdownBadge}
        `;
      }

      return `
        <tr data-key="${lic.license_key}">
          <td style="color:var(--text-subtle); font-family:var(--font-mono); font-size:0.8rem;">${rowNum}</td>
          <td>
            <div class="key-box">
              <span>${lic.license_key}</span>
              <button class="btn-copy-mini" onclick="window.copyLicenseKey('${lic.license_key}', this)" title="Salin Kunci Ini">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          </td>
          <td>${statusBadgeHtml}</td>
          <td>${candidateInfo}</td>
          <td>${activatedDate}</td>
          <td>${expiryInfo}</td>
          <td style="text-align: right;">
            <div style="display:inline-flex; gap:0.35rem; justify-content:flex-end;">
              <button class="btn-admin btn-emerald btn-sm" onclick="window.openShopeeMessageModal('${lic.license_key}')" title="Salin Mesej Shopee / WhatsApp">
                <i class="fa-solid fa-paper-plane"></i> Mesej
              </button>
              <button class="btn-admin btn-outline btn-sm" onclick="window.openManageModal('${lic.license_key}')" title="Urus & Edit Kunci">
                <i class="fa-solid fa-pen-to-square"></i> Urus
              </button>
              ${lic.status === 'USED' ? `
                <button class="btn-admin btn-amber-outline btn-sm" onclick="window.quickResetKey('${lic.license_key}')" title="Reset status kepada ACTIVE untuk peranti baharu">
                  <i class="fa-solid fa-arrows-rotate"></i> Reset
                </button>
              ` : ''}
              ${lic.status === 'BLOCKED' ? `
                <button class="btn-admin btn-emerald btn-sm" onclick="window.quickToggleBlockKey('${lic.license_key}', 'UNBLOCK')" title="Buka Sekatan Kunci">
                  <i class="fa-solid fa-unlock"></i>
                </button>
              ` : `
                <button class="btn-admin btn-danger-outline btn-sm" onclick="window.quickToggleBlockKey('${lic.license_key}', 'BLOCK')" title="Sekat Kunci Ini">
                  <i class="fa-solid fa-ban"></i>
                </button>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    renderPagination(totalPages);
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      dom.paginationWrap.innerHTML = '';
      return;
    }

    let html = `
      <button class="btn-page" ${state.currentPage === 1 ? 'disabled' : ''} onclick="window.changePage(${state.currentPage - 1})">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
    `;

    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || (p >= state.currentPage - 2 && p <= state.currentPage + 2)) {
        html += `
          <button class="btn-page ${p === state.currentPage ? 'active' : ''}" onclick="window.changePage(${p})">
            ${p}
          </button>
        `;
      } else if (p === state.currentPage - 3 || p === state.currentPage + 3) {
        html += `<span style="color:var(--text-subtle); padding:0 4px;">...</span>`;
      }
    }

    html += `
      <button class="btn-page ${state.currentPage === totalPages ? 'disabled' : ''} onclick="window.changePage(${state.currentPage + 1})">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    `;

    dom.paginationWrap.innerHTML = html;
  }

  /* =========================================================================
     DATE FORMATTING HELPERS
     ========================================================================= */
  function formatDateClean(dateObj) {
    const months = ['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ogo', 'Sep', 'Okt', 'Nov', 'Dis'];
    return `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
  }

  function formatTimeClean(dateObj) {
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  /* =========================================================================
     KEY GENERATOR HELPER (500 SIRI ALGORITHM)
     ========================================================================= */
  function generatePkskKeyString() {
    const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // Tanpa 0, O, 1, I, L
    let seg1 = '', seg2 = '', seg3 = '';
    for (let i = 0; i < 4; i++) seg1 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) seg2 += chars.charAt(Math.floor(Math.random() * chars.length));
    for (let i = 0; i < 4; i++) seg3 += chars.charAt(Math.floor(Math.random() * chars.length));
    return `PKSK-${seg1}-${seg2}-${seg3}`;
  }

  /* =========================================================================
     GLOBAL EXPOSED ACTIONS (ONCLICK HANDLERS)
     ========================================================================= */
  window.changePage = function (page) {
    state.currentPage = page;
    renderTable();
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  window.copyLicenseKey = function (key, btnElement) {
    navigator.clipboard.writeText(key).then(() => {
      showToast(`Kunci <strong>${key}</strong> telah disalin ke papan keratan!`, 'info');
      if (btnElement) {
        const icon = btnElement.querySelector('i');
        if (icon) {
          icon.className = 'fa-solid fa-check';
          btnElement.classList.add('copied');
          setTimeout(() => {
            icon.className = 'fa-regular fa-copy';
            btnElement.classList.remove('copied');
          }, 1200);
        }
      }
    });
  };

  window.quickResetKey = async function (key) {
    if (!confirm(`Adakah anda pasti untuk RESET kunci "${key}"?\n\nStatus akan ditukar kepada 'ACTIVE' dan perkaitan peranti akan dipadamkan supaya pembeli boleh mengaktifkannya semula pada peranti baharu.`)) {
      return;
    }

    try {
      const updated = await updateLicenseInSupabase(key, {
        status: 'ACTIVE',
        device_id: null,
        activated_by_name: null,
        activated_by_ic: null,
        activated_at: null,
        expires_at: null
      });

      // Update state tempatan
      const idx = state.allLicenses.findIndex(l => l.license_key === key);
      if (idx !== -1) {
        state.allLicenses[idx] = { ...state.allLicenses[idx], ...updated };
      }

      updateStats();
      applyFiltersAndSearch();
      showToast(`Kunci <strong>${key}</strong> berjaya di-reset! Sedia untuk diguna semula.`, 'success');

    } catch (err) {
      showToast(`Ralat reset: ${err.message}`, 'error');
    }
  };

  window.quickToggleBlockKey = async function (key, action) {
    const newStatus = action === 'BLOCK' ? 'BLOCKED' : 'ACTIVE';
    const msgPrompt = action === 'BLOCK' 
      ? `SEKAT Kunci "${key}"? Pengguna tidak akan dapat mengakses simulator.`
      : `Buka sekatan untuk kunci "${key}"?`;

    if (!confirm(msgPrompt)) return;

    try {
      const updated = await updateLicenseInSupabase(key, { status: newStatus });

      const idx = state.allLicenses.findIndex(l => l.license_key === key);
      if (idx !== -1) {
        state.allLicenses[idx] = { ...state.allLicenses[idx], ...updated };
      }

      updateStats();
      applyFiltersAndSearch();
      showToast(`Kunci <strong>${key}</strong> telah ${action === 'BLOCK' ? 'disekat' : 'dibuka sekatan'}.`, 'info');

    } catch (err) {
      showToast(`Ralat: ${err.message}`, 'error');
    }
  };

  window.openManageModal = function (key) {
    const lic = state.allLicenses.find(l => l.license_key === key);
    if (!lic) return;

    state.selectedLicense = lic;

    dom.modalDispKey.textContent = lic.license_key;
    dom.modalInputName.value = lic.activated_by_name || '';
    dom.modalInputIc.value = lic.activated_by_ic || '';
    dom.modalInputDeviceId.value = lic.device_id || '(Tiada)';

    // Status badge
    let badgeClass = lic.status.toLowerCase();
    dom.modalDispStatusBadge.innerHTML = `<span class="status-badge ${badgeClass}">${lic.status}</span>`;

    // Expiration input (format for datetime-local)
    if (lic.expires_at) {
      const d = new Date(lic.expires_at);
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      dom.modalInputExpiresAt.value = iso;
    } else {
      dom.modalInputExpiresAt.value = '';
    }

    dom.btnModalToggleBlock.innerHTML = lic.status === 'BLOCKED' 
      ? '<i class="fa-solid fa-unlock"></i> Buka Sekatan' 
      : '<i class="fa-solid fa-ban"></i> Sekat Kunci';

    dom.modalManageLicense.classList.remove('hidden');
  };

  /* =========================================================================
     MODAL EVENT LISTENERS
     ========================================================================= */
  function initEventListeners() {
    // Refresh Button
    dom.btnRefreshData.onclick = fetchAllLicensesFromSupabase;

    // Search Input
    dom.inputSearch.oninput = (e) => {
      state.searchQuery = e.target.value;
      applyFiltersAndSearch();
    };

    // Filter Pills
    dom.filterPills.forEach(pill => {
      pill.onclick = () => {
        dom.filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        state.currentStatusFilter = pill.getAttribute('data-status');
        applyFiltersAndSearch();
      };
    });

    // Copy 1 Next Available Key
    dom.btnCopyNextAvailable.onclick = () => {
      const available = state.allLicenses.find(l => l.status === 'ACTIVE');
      if (!available) {
        showToast('Semua kunci telah digunakan! Sila jana kunci baharu.', 'error');
        return;
      }
      navigator.clipboard.writeText(available.license_key).then(() => {
        showToast(`1 Kunci Tersedia Disalin: <strong>${available.license_key}</strong>`, 'success');
      });
    };

    // Copy Batch 10 Available Keys
    dom.btnCopyBatchAvailable.onclick = () => {
      const availableKeys = state.allLicenses.filter(l => l.status === 'ACTIVE').slice(0, 10);
      if (availableKeys.length === 0) {
        showToast('Tiada kunci tersedia untuk disalin.', 'error');
        return;
      }
      const textBlock = availableKeys.map(l => l.license_key).join('\n');
      navigator.clipboard.writeText(textBlock).then(() => {
        showToast(`${availableKeys.length} Kunci Tersedia berjaya disalin sekaligus!`, 'success');
      });
    };

    // Export to CSV
    dom.btnExportCsv.onclick = () => {
      const dataToExport = state.filteredLicenses.length > 0 ? state.filteredLicenses : state.allLicenses;
      let csvContent = 'data:text/csv;charset=utf-8,No,License_Key,Status,Tier,Candidate_Name,Candidate_IC,Device_ID,Activated_At,Expires_At\n';

      dataToExport.forEach((l, i) => {
        const row = [
          i + 1,
          `"${l.license_key}"`,
          `"${l.status}"`,
          `"${l.tier || 'PREMIUM_6_MONTHS'}"`,
          `"${l.activated_by_name || ''}"`,
          `"${l.activated_by_ic || ''}"`,
          `"${l.device_id || ''}"`,
          `"${l.activated_at || ''}"`,
          `"${l.expires_at || ''}"`
        ];
        csvContent += row.join(',') + '\n';
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `PKSK_Licenses_Export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`Fail CSV (${dataToExport.length} rekod) berjaya dieksport!`, 'success');
    };

    // Manage Modal Close
    dom.btnCloseManageModal.onclick = () => dom.modalManageLicense.classList.add('hidden');
    dom.btnCancelManage.onclick = () => dom.modalManageLicense.classList.add('hidden');

    // Quick Date Extension Buttons
    dom.btnQuickAdd30d.onclick = () => addDaysToExpiry(30);
    dom.btnQuickAdd180d.onclick = () => addDaysToExpiry(180);
    dom.btnQuickAdd365d.onclick = () => addDaysToExpiry(365);

    function addDaysToExpiry(days) {
      let baseDate = new Date();
      if (dom.modalInputExpiresAt.value) {
        baseDate = new Date(dom.modalInputExpiresAt.value);
      }
      const newDate = new Date(baseDate.getTime() + (days * 24 * 60 * 60 * 1000));
      const iso = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      dom.modalInputExpiresAt.value = iso;
      showToast(`Ditambah +${days} Hari ke tarikh luput.`, 'info');
    }

    // Modal Reset Action
    dom.btnModalResetKey.onclick = async () => {
      if (!state.selectedLicense) return;
      await window.quickResetKey(state.selectedLicense.license_key);
      dom.modalManageLicense.classList.add('hidden');
    };

    // Modal Toggle Block
    dom.btnModalToggleBlock.onclick = async () => {
      if (!state.selectedLicense) return;
      const action = state.selectedLicense.status === 'BLOCKED' ? 'UNBLOCK' : 'BLOCK';
      await window.quickToggleBlockKey(state.selectedLicense.license_key, action);
      dom.modalManageLicense.classList.add('hidden');
    };

    // Save License Changes
    dom.btnSaveLicenseChanges.onclick = async () => {
      if (!state.selectedLicense) return;

      const key = state.selectedLicense.license_key;
      const name = dom.modalInputName.value.trim();
      const ic = dom.modalInputIc.value.trim();
      const expVal = dom.modalInputExpiresAt.value;

      let expiresAt = null;
      if (expVal) {
        expiresAt = new Date(expVal).toISOString();
      }

      dom.btnSaveLicenseChanges.disabled = true;
      dom.btnSaveLicenseChanges.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

      try {
        const updated = await updateLicenseInSupabase(key, {
          activated_by_name: name || null,
          activated_by_ic: ic || null,
          expires_at: expiresAt
        });

        const idx = state.allLicenses.findIndex(l => l.license_key === key);
        if (idx !== -1) {
          state.allLicenses[idx] = { ...state.allLicenses[idx], ...updated };
        }

        updateStats();
        applyFiltersAndSearch();
        dom.modalManageLicense.classList.add('hidden');
        showToast(`Perubahan kunci <strong>${key}</strong> berjaya disimpan!`, 'success');

      } catch (err) {
        showToast(`Ralat menyimpan: ${err.message}`, 'error');
      } finally {
        dom.btnSaveLicenseChanges.disabled = false;
        dom.btnSaveLicenseChanges.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan';
      }
    };

    // Generate Modal Handlers
    dom.btnOpenGenerateModal.onclick = () => {
      dom.genResultBox.style.display = 'none';
      dom.modalGenerateKeys.classList.remove('hidden');
    };
    dom.btnCloseGenModal.onclick = () => dom.modalGenerateKeys.classList.add('hidden');
    dom.btnCancelGen.onclick = () => dom.modalGenerateKeys.classList.add('hidden');

    dom.btnExecuteGenerate.onclick = async () => {
      const count = parseInt(dom.selectGenQuantity.value, 10) || 10;
      const existingKeys = new Set(state.allLicenses.map(l => l.license_key));

      const newRecords = [];
      const generatedKeys = [];

      while (newRecords.length < count) {
        const newKey = generatePkskKeyString();
        if (!existingKeys.has(newKey)) {
          existingKeys.add(newKey);
          generatedKeys.push(newKey);
          newRecords.push({
            license_key: newKey,
            status: 'ACTIVE',
            tier: 'PREMIUM_6_MONTHS',
            max_devices: 1
          });
        }
      }

      dom.btnExecuteGenerate.disabled = true;
      dom.btnExecuteGenerate.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menjana & Menyimpan...';

      try {
        const inserted = await insertLicensesToSupabase(newRecords);

        state.allLicenses.push(...(inserted || newRecords));
        updateStats();
        applyFiltersAndSearch();

        dom.genResultBox.style.display = 'block';
        dom.genResultBox.innerHTML = `<strong>✓ ${count} Kunci Baharu Berjaya Dijana:</strong><br>` + generatedKeys.join('<br>');

        showToast(`Tahniah! ${count} Kunci Lesen baharu berjaya disimpan ke Supabase!`, 'success');

      } catch (err) {
        showToast(`Ralat menjana: ${err.message}`, 'error');
      } finally {
        dom.btnExecuteGenerate.disabled = false;
        dom.btnExecuteGenerate.innerHTML = '<i class="fa-solid fa-bolt"></i> Jana & Simpan ke Supabase';
      }
    };

    // Config Modal Handlers
    dom.btnOpenConfigModal.onclick = () => {
      const conf = getSupabaseConfig();
      dom.cfgSupabaseUrl.value = conf.url;
      dom.cfgSupabaseKey.value = conf.key;
      dom.modalConfig.classList.remove('hidden');
    };
    dom.btnCloseConfigModal.onclick = () => dom.modalConfig.classList.add('hidden');
    dom.btnCancelConfig.onclick = () => dom.modalConfig.classList.add('hidden');

    dom.btnSaveConfig.onclick = () => {
      const url = dom.cfgSupabaseUrl.value.trim().replace(/\/$/, '');
      const key = dom.cfgSupabaseKey.value.trim();
      if (!url || !key) {
        showToast('Sila masukkan Project URL dan Anon Key.', 'error');
        return;
      }
      localStorage.setItem(STORAGE_KEY_URL, url);
      localStorage.setItem(STORAGE_KEY_KEY, key);
      dom.modalConfig.classList.add('hidden');
      showToast('Konfigurasi Supabase dikemaskini. Menyegarkan data...', 'success');
      fetchAllLicensesFromSupabase();
    };

    // Shopee Quick Assign & Message Modal Handlers
    if (dom.btnQuickShopeeAssign) {
      dom.btnQuickShopeeAssign.onclick = () => openQuickShopeeAssignModal();
    }
    if (dom.btnQuickShopeeAssignBanner) {
      dom.btnQuickShopeeAssignBanner.onclick = () => openQuickShopeeAssignModal();
    }
    if (dom.btnCloseShopeeModal) {
      dom.btnCloseShopeeModal.onclick = () => dom.modalShopeeMessage.classList.add('hidden');
    }
    if (dom.btnCancelShopeeModal) {
      dom.btnCancelShopeeModal.onclick = () => dom.modalShopeeMessage.classList.add('hidden');
    }
    if (dom.btnCopyOnlyKey) {
      dom.btnCopyOnlyKey.onclick = () => {
        const key = dom.shopeeModalKey.value;
        if (key) {
          navigator.clipboard.writeText(key);
          showToast(`Kunci <strong>${key}</strong> disalin!`, 'success');
        }
      };
    }
    if (dom.shopeeModalBuyer) {
      dom.shopeeModalBuyer.oninput = updateShopeeMessagePreview;
    }
    if (dom.shopeeModalOrder) {
      dom.shopeeModalOrder.oninput = updateShopeeMessagePreview;
    }
    if (dom.shopeeModalUrl) {
      dom.shopeeModalUrl.oninput = updateShopeeMessagePreview;
    }
    if (dom.btnCopyShopeeMessageOnly) {
      dom.btnCopyShopeeMessageOnly.onclick = copyShopeeMessageOnly;
    }
    if (dom.btnSaveAndCopyShopeeMessage) {
      dom.btnSaveAndCopyShopeeMessage.onclick = saveAndCopyShopeeMessage;
    }

    // Admin Auth Listeners
    if (dom.loginGateForm) {
      dom.loginGateForm.onsubmit = handleLoginSubmit;
    }
    if (dom.btnToggleLoginPass) {
      dom.btnToggleLoginPass.onclick = togglePasswordVisibility;
    }
    if (dom.btnLogoutAdmin) {
      dom.btnLogoutAdmin.onclick = handleLogout;
    }

    // Global Keyboard Shortcuts (Operate Mode Accessibility)
    document.addEventListener('keydown', (e) => {
      // Escape closes any active modal
      if (e.key === 'Escape') {
        if (dom.modalManageLicense) dom.modalManageLicense.classList.add('hidden');
        if (dom.modalGenerateKeys) dom.modalGenerateKeys.classList.add('hidden');
        if (dom.modalConfig) dom.modalConfig.classList.add('hidden');
        if (dom.modalShopeeMessage) dom.modalShopeeMessage.classList.add('hidden');
      }
      // Slash '/' focuses search bar
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        if (dom.inputSearch) dom.inputSearch.focus();
      }
      // Alt + S opens Shopee dispatch modal
      if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        openQuickShopeeAssignModal();
      }
    });
  }

  /* =========================================================================
     ADMIN AUTHENTICATION GATE (@reeZ860)
     ========================================================================= */
  function isAuthenticated() {
    return sessionStorage.getItem(STORAGE_KEY_AUTH) === 'authenticated';
  }

  function handleLoginSubmit(e) {
    if (e) e.preventDefault();
    const enteredPassword = dom.loginPasswordInput.value.trim();

    if (enteredPassword === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY_AUTH, 'authenticated');
      dom.loginGateOverlay.classList.add('hidden');
      if (dom.loginErrorMsg) dom.loginErrorMsg.style.display = 'none';
      showToast('✓ Log masuk pentadbir berjaya! Selamat kembali.', 'success');
      fetchAllLicensesFromSupabase();
    } else {
      if (dom.loginErrorMsg) dom.loginErrorMsg.style.display = 'block';
      const card = dom.loginGateOverlay ? dom.loginGateOverlay.querySelector('.login-gate-card') : null;
      if (card) {
        card.classList.remove('shake-animation');
        void card.offsetWidth;
        card.classList.add('shake-animation');
      }
      dom.loginPasswordInput.value = '';
      dom.loginPasswordInput.focus();
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
    dom.loginPasswordInput.value = '';
    if (dom.loginErrorMsg) dom.loginErrorMsg.style.display = 'none';
    dom.loginGateOverlay.classList.remove('hidden');
    dom.loginPasswordInput.focus();
    showToast('Anda telah log keluar daripada sistem pentadbir.', 'info');
  }

  function togglePasswordVisibility() {
    if (!dom.loginPasswordInput) return;
    const isPass = dom.loginPasswordInput.type === 'password';
    dom.loginPasswordInput.type = isPass ? 'text' : 'password';
    if (dom.eyeIcon) {
      dom.eyeIcon.className = isPass ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    }
  }

  /* =========================================================================
     SHOPEE MESSAGE BUILDER & QUICK ASSIGN
     ========================================================================= */
  function generateShopeeDeliveryMessage(licenseKey, buyerName, orderId, webUrl) {
    const cleanName = buyerName && buyerName.trim() ? buyerName.trim() : 'Tuan / Puan';
    const baseWebUrl = webUrl && webUrl.trim() ? webUrl.trim().replace(/\/$/, '') : 'https://pksk2026.vercel.app';
    const directAccessUrl = `${baseWebUrl}/?key=${encodeURIComponent(licenseKey)}`;

    return `Salam sejahtera kepada ${cleanName} & Terima kasih atas pembelian di Shopee kami! ⭐⭐⭐⭐⭐

Berikut adalah pautan & Kod Lesen untuk mengakses Simulator PKSK Tingkatan 1 (KPM) 2026 anda:

🔗 Pautan Akses Web: ${directAccessUrl}
🔑 Kod Lesen Anda: ${licenseKey}
📦 Kandungan Pakej:
1. Akses Penuh 500+ Bank Soalan Autentik KPM (Bahagian A, B & C)
2. Cikgu AI Semak Esei Serta-Merta (Ox Alpha Engine)
3. Simulasi Peperiksaan Masa Nyata & Skema Penjelasan Konsep Lengkap

⚠️ PENTING:
- Kod lesen ini terhad kepada 2 PERANTI (Laptop / Tablet / Telefon) sahaja.
- Tempoh sah akses adalah 6 BULAN (180 Hari) bermula tarikh pengaktifan pertama.
- Sila simpan Kod Lesen ini untuk rujukan anda.

Selamat membuat persediaan dan semoga anakanda beroleh keputusan cemerlang melangkah ke SBP / MRSM 2026! 🎯`;
  }

  function updateShopeeMessagePreview() {
    if (!dom.shopeeModalKey) return;
    const key = dom.shopeeModalKey.value || 'PKSK-XXXX-XXXX-XXXX';
    const buyer = dom.shopeeModalBuyer.value;
    const order = dom.shopeeModalOrder.value;
    const url = dom.shopeeModalUrl.value;
    dom.shopeeMessagePreview.value = generateShopeeDeliveryMessage(key, buyer, order, url);
  }

  function openQuickShopeeAssignModal(specificKey = null) {
    let targetKey = specificKey;
    let targetLic = null;

    if (targetKey) {
      targetLic = state.allLicenses.find(l => l.license_key === targetKey);
    } else {
      targetLic = state.allLicenses.find(l => l.status === 'ACTIVE');
      if (targetLic) {
        targetKey = targetLic.license_key;
      }
    }

    if (!targetKey) {
      showToast('Tiada kunci ACTIVE yang tersedia. Sila jana kunci baharu.', 'error');
      return;
    }

    dom.shopeeModalKey.value = targetKey;
    dom.shopeeModalBuyer.value = targetLic && targetLic.activated_by_name && targetLic.activated_by_name !== 'Calon PKSK' ? targetLic.activated_by_name : '';
    dom.shopeeModalOrder.value = targetLic && targetLic.activated_by_ic && targetLic.activated_by_ic !== '-' ? targetLic.activated_by_ic : '';
    
    updateShopeeMessagePreview();
    dom.modalShopeeMessage.classList.remove('hidden');
    dom.shopeeModalBuyer.focus();
  }

  async function copyShopeeMessageOnly() {
    const msg = dom.shopeeMessagePreview.value;
    if (!msg) return;
    try {
      await navigator.clipboard.writeText(msg);
      showToast('📋 Templat mesej Shopee telah disalin ke clipboard!', 'success');
    } catch (e) {
      showToast('Gagal menyalin mesej ke clipboard.', 'error');
    }
  }

  async function saveAndCopyShopeeMessage() {
    const key = dom.shopeeModalKey.value;
    const buyerName = dom.shopeeModalBuyer.value.trim();
    const orderId = dom.shopeeModalOrder.value.trim();
    const msg = dom.shopeeMessagePreview.value;

    if (!key) return;

    dom.btnSaveAndCopyShopeeMessage.disabled = true;
    dom.btnSaveAndCopyShopeeMessage.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

    try {
      await navigator.clipboard.writeText(msg);

      if (buyerName || orderId) {
        const lic = state.allLicenses.find(l => l.license_key === key);
        const updatePayload = {
          activated_by_name: buyerName || (lic ? lic.activated_by_name : 'Calon PKSK'),
          activated_by_ic: orderId || (lic ? lic.activated_by_ic : '-')
        };

        const updated = await updateLicenseInSupabase(key, updatePayload);
        const idx = state.allLicenses.findIndex(l => l.license_key === key);
        if (idx !== -1) {
          state.allLicenses[idx] = { ...state.allLicenses[idx], ...updated };
        }

        updateStats();
        applyFiltersAndSearch();
        showToast(`✓ Maklumat ${buyerName || 'pembeli'} disimpan & Mesej Shopee disalin!`, 'success');
      } else {
        showToast('📋 Mesej Shopee berjaya disalin ke clipboard!', 'success');
      }

      dom.modalShopeeMessage.classList.add('hidden');
    } catch (err) {
      console.error(err);
      showToast('Ralat semasa menyimpan maklumat pembeli: ' + err.message, 'error');
    } finally {
      dom.btnSaveAndCopyShopeeMessage.disabled = false;
      dom.btnSaveAndCopyShopeeMessage.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Simpan Pembeli & Salin Mesej';
    }
  }

  window.openShopeeMessageModal = openQuickShopeeAssignModal;

  // Initialization
  document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    if (isAuthenticated()) {
      if (dom.loginGateOverlay) dom.loginGateOverlay.classList.add('hidden');
      fetchAllLicensesFromSupabase();
    } else {
      if (dom.loginGateOverlay) {
        dom.loginGateOverlay.classList.remove('hidden');
        if (dom.loginPasswordInput) dom.loginPasswordInput.focus();
      }
    }
  });

})();
