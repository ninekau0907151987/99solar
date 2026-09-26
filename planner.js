// 99 Solar Rooftop Engineering Planner Logic
// Author: บจก. 99 แมทช์ เมคเกอร์ (99 Solar หาดใหญ่)
// Comprehensive Solar Engineering Tool: 2D Roof Sketch, Rails & Clamps, Building Elevation Conduit Sim,
// PEA Meter Quota Compliance, Hybrid BESS Battery, Electrical Sizing (วสท.), Local Storage Save/Load,
// BOM Generator, Customer Quotation & LINE Share Assistant

let disabledPanels = new Set();
let showRails = true;
let currentView = 'roof'; // 'roof' or 'elevation'

document.addEventListener('DOMContentLoaded', () => {
  initPlanner();
});

// Toast Notification Helper
function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMessage');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-3');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-3');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 2600);
}

// Global Quick Presets Helper
window.applyPreset = function(type) {
  const roofWidthInput = document.getElementById('roofWidth');
  const roofLengthInput = document.getElementById('roofLength');
  const roofTypeSelect = document.getElementById('roofType');
  const buildingFloorSelect = document.getElementById('buildingFloor');
  const horizCableRunInput = document.getElementById('horizCableRun');
  const panelPresetSelect = document.getElementById('panelPreset');
  const panelWInput = document.getElementById('panelW');
  const panelLInput = document.getElementById('panelL');
  const peaMeterSize = document.getElementById('peaMeterSize');

  disabledPanels.clear();

  if (type === 'house2f') {
    if (roofWidthInput) roofWidthInput.value = '10.0';
    if (roofLengthInput) roofLengthInput.value = '6.0';
    if (roofTypeSelect) roofTypeSelect.value = 'metalthru';
    if (buildingFloorSelect) buildingFloorSelect.value = '2';
    if (horizCableRunInput) horizCableRunInput.value = '12';
    if (peaMeterSize) peaMeterSize.value = '1p_15_45';
  } else if (type === 'townhome') {
    if (roofWidthInput) roofWidthInput.value = '6.0';
    if (roofLengthInput) roofLengthInput.value = '5.0';
    if (roofTypeSelect) roofTypeSelect.value = 'cpac';
    if (buildingFloorSelect) buildingFloorSelect.value = '3';
    if (horizCableRunInput) horizCableRunInput.value = '10';
    if (peaMeterSize) peaMeterSize.value = '1p_15_45';
  } else if (type === 'carport') {
    if (roofWidthInput) roofWidthInput.value = '6.0';
    if (roofLengthInput) roofLengthInput.value = '6.0';
    if (roofTypeSelect) roofTypeSelect.value = 'carport';
    if (buildingFloorSelect) buildingFloorSelect.value = '1';
    if (horizCableRunInput) horizCableRunInput.value = '8';
    if (peaMeterSize) peaMeterSize.value = '1p_15_45';
  } else if (type === 'factory') {
    if (roofWidthInput) roofWidthInput.value = '24.0';
    if (roofLengthInput) roofLengthInput.value = '12.0';
    if (roofTypeSelect) roofTypeSelect.value = 'seamlock';
    if (buildingFloorSelect) buildingFloorSelect.value = '1';
    if (horizCableRunInput) horizCableRunInput.value = '25';
    if (peaMeterSize) peaMeterSize.value = '3p_30_100';
  }

  // Set 650W default
  if (panelPresetSelect) panelPresetSelect.value = '650';
  if (panelWInput) panelWInput.value = '1.134';
  if (panelLInput) panelLInput.value = '2.384';

  runPlanner();
  showToast(`โหลดเทมเพลต ${type} สำเร็จ!`);
};

function initPlanner() {
  const roofWidthInput = document.getElementById('roofWidth');
  const roofLengthInput = document.getElementById('roofLength');
  const roofTypeSelect = document.getElementById('roofType');
  const roofMarginSelect = document.getElementById('roofMargin');
  const roofOrientation = document.getElementById('roofOrientation');
  const panelPresetSelect = document.getElementById('panelPreset');
  const panelWInput = document.getElementById('panelW');
  const panelLInput = document.getElementById('panelL');
  const buildingFloorSelect = document.getElementById('buildingFloor');
  const horizCableRunInput = document.getElementById('horizCableRun');
  const inverterLocationSelect = document.getElementById('inverterLocation');
  const peaMeterSize = document.getElementById('peaMeterSize');
  const batteryCapacity = document.getElementById('batteryCapacity');
  const batteryOptionsRow = document.getElementById('batteryOptionsRow');

  const btnRecalculate = document.getElementById('btnRecalculate');
  const btnToggleRails = document.getElementById('btnToggleRails');
  const btnResetPanels = document.getElementById('btnResetPanels');
  const tabRoofPlan = document.getElementById('tabRoofPlan');
  const tabElevation = document.getElementById('tabElevation');

  // Bottom Tabs (BOM vs Quotation)
  const tabBomBtn = document.getElementById('tabBomBtn');
  const tabQuotationBtn = document.getElementById('tabQuotationBtn');
  const bomContainer = document.getElementById('bomContainer');
  const quotationContainer = document.getElementById('quotationContainer');

  if (tabBomBtn && tabQuotationBtn && bomContainer && quotationContainer) {
    tabBomBtn.addEventListener('click', () => {
      tabBomBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-sm flex items-center gap-1.5 transition-all';
      tabQuotationBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 transition-all';
      bomContainer.classList.remove('hidden');
      quotationContainer.classList.add('hidden');
    });

    tabQuotationBtn.addEventListener('click', () => {
      tabQuotationBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white shadow-sm flex items-center gap-1.5 transition-all';
      tabBomBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 transition-all';
      quotationContainer.classList.remove('hidden');
      bomContainer.classList.add('hidden');
    });
  }

  // Visual Area Tab Switcher
  if (tabRoofPlan && tabElevation) {
    tabRoofPlan.addEventListener('click', () => {
      currentView = 'roof';
      tabRoofPlan.className = 'px-3.5 py-1.5 rounded-xl font-bold text-xs bg-brand-600 text-white shadow-sm flex items-center gap-1.5 transition-all';
      tabElevation.className = 'px-3.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 transition-all';
      document.getElementById('containerRoofPlan').classList.remove('hidden');
      document.getElementById('containerElevation').classList.add('hidden');
      const subtitle = document.getElementById('viewSubtitle');
      if (subtitle) subtitle.textContent = 'คลิกที่แผงเพื่อตัดแผงออก (กรณีติดช่องแสง/แท็งก์น้ำ) หรือดูแนวรางอะลูมิเนียม';
      runPlanner();
    });

    tabElevation.addEventListener('click', () => {
      currentView = 'elevation';
      tabElevation.className = 'px-3.5 py-1.5 rounded-xl font-bold text-xs bg-brand-600 text-white shadow-sm flex items-center gap-1.5 transition-all';
      tabRoofPlan.className = 'px-3.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 transition-all';
      document.getElementById('containerElevation').classList.remove('hidden');
      document.getElementById('containerRoofPlan').classList.add('hidden');
      const subtitle = document.getElementById('viewSubtitle');
      if (subtitle) subtitle.textContent = 'ภาพจำลองหน้าตัดอาคาร ท่อร้อยสายไฟ EMT ตู้ Combiner Inverter แบตเตอรี่ และระบบสายดิน';
      runPlanner();
    });
  }

  // Toggle Rails Button
  if (btnToggleRails) {
    btnToggleRails.addEventListener('click', () => {
      showRails = !showRails;
      btnToggleRails.classList.toggle('bg-amber-100', showRails);
      btnToggleRails.classList.toggle('text-amber-800', showRails);
      runPlanner();
    });
  }

  // Reset Panels Button
  if (btnResetPanels) {
    btnResetPanels.addEventListener('click', () => {
      disabledPanels.clear();
      runPlanner();
      showToast('รีเซ็ตเปิดแผงทั้งหมดแล้ว');
    });
  }

  // System Type (On-Grid vs Hybrid) Listener
  document.querySelectorAll('input[name="systemType"]').forEach(r => {
    r.addEventListener('change', () => {
      const isHybrid = document.querySelector('input[name="systemType"]:checked')?.value === 'hybrid';
      if (batteryOptionsRow) {
        batteryOptionsRow.classList.toggle('hidden', !isHybrid);
      }
      runPlanner();
    });
  });

  // Sync panel preset dimensions
  if (panelPresetSelect) {
    panelPresetSelect.addEventListener('change', () => {
      const val = panelPresetSelect.value;
      if (val === '650') {
        panelWInput.value = '1.134';
        panelLInput.value = '2.384';
      } else if (val === '600') {
        panelWInput.value = '1.134';
        panelLInput.value = '2.278';
      } else if (val === '550') {
        panelWInput.value = '1.134';
        panelLInput.value = '2.278';
      } else if (val === '450') {
        panelWInput.value = '1.038';
        panelLInput.value = '2.094';
      }
      disabledPanels.clear();
      runPlanner();
    });
  }

  // Trigger recalculate on any change
  const inputs = [
    roofWidthInput, roofLengthInput, roofTypeSelect, roofMarginSelect, roofOrientation,
    panelWInput, panelLInput, buildingFloorSelect, horizCableRunInput, inverterLocationSelect,
    peaMeterSize, batteryCapacity
  ];
  inputs.forEach(input => {
    if (input) input.addEventListener('input', runPlanner);
    if (input) input.addEventListener('change', runPlanner);
  });

  document.querySelectorAll('input[name="panelOrient"]').forEach(r => {
    r.addEventListener('change', () => {
      disabledPanels.clear();
      runPlanner();
    });
  });

  if (btnRecalculate) {
    btnRecalculate.addEventListener('click', () => {
      disabledPanels.clear();
      runPlanner();
    });
  }

  // Project Save & Load & LINE Share setup
  setupProjectManagement();

  // Initial calculation run
  runPlanner();
}

// -------------------------------------------------------------
// PROJECT MANAGEMENT & LINE SHARE LOGIC
// -------------------------------------------------------------
function setupProjectManagement() {
  const btnSaveProject = document.getElementById('btnSaveProject');
  const savedProjectsSelect = document.getElementById('savedProjectsSelect');
  const btnCopyLine = document.getElementById('btnCopyLine');
  const projectCustomerName = document.getElementById('projectCustomerName');

  function getSavedProjects() {
    try {
      return JSON.parse(localStorage.getItem('solar_saved_projects') || '[]');
    } catch (e) {
      return [];
    }
  }

  function refreshProjectsDropdown() {
    if (!savedProjectsSelect) return;
    const projects = getSavedProjects();
    savedProjectsSelect.innerHTML = '<option value="">📂 โหลดโครงการเก่า...</option>';
    projects.forEach((proj, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${proj.name} (${proj.kw} kWp)`;
      savedProjectsSelect.appendChild(opt);
    });
  }

  if (btnSaveProject) {
    btnSaveProject.addEventListener('click', () => {
      const name = projectCustomerName?.value.trim() || 'โครงการบ้านพักอาศัย';
      const kw = document.getElementById('badgeTotalKw')?.textContent || '0.00';
      const panels = document.getElementById('badgeTotalPanels')?.textContent || '0';

      const projectData = {
        name, kw, panels,
        roofW: document.getElementById('roofWidth')?.value,
        roofL: document.getElementById('roofLength')?.value,
        roofType: document.getElementById('roofType')?.value,
        roofMargin: document.getElementById('roofMargin')?.value,
        roofOrientation: document.getElementById('roofOrientation')?.value,
        panelPreset: document.getElementById('panelPreset')?.value,
        panelW: document.getElementById('panelW')?.value,
        panelL: document.getElementById('panelL')?.value,
        panelOrient: document.querySelector('input[name="panelOrient"]:checked')?.value,
        buildingFloor: document.getElementById('buildingFloor')?.value,
        horizCableRun: document.getElementById('horizCableRun')?.value,
        inverterLocation: document.getElementById('inverterLocation')?.value,
        peaMeterSize: document.getElementById('peaMeterSize')?.value,
        systemType: document.querySelector('input[name="systemType"]:checked')?.value,
        batteryCapacity: document.getElementById('batteryCapacity')?.value,
        disabledPanels: Array.from(disabledPanels),
        date: new Date().toLocaleDateString('th-TH')
      };

      const projects = getSavedProjects();
      const existingIdx = projects.findIndex(p => p.name === name);
      if (existingIdx >= 0) {
        projects[existingIdx] = projectData;
      } else {
        projects.unshift(projectData);
      }

      localStorage.setItem('solar_saved_projects', JSON.stringify(projects.slice(0, 30)));
      refreshProjectsDropdown();
      showToast(`บันทึกโครงการ "${name}" สำเร็จ!`);
    });
  }

  if (savedProjectsSelect) {
    savedProjectsSelect.addEventListener('change', () => {
      const idx = savedProjectsSelect.value;
      if (idx === '') return;
      const projects = getSavedProjects();
      const p = projects[parseInt(idx)];
      if (!p) return;

      if (projectCustomerName) projectCustomerName.value = p.name;
      if (document.getElementById('roofWidth')) document.getElementById('roofWidth').value = p.roofW;
      if (document.getElementById('roofLength')) document.getElementById('roofLength').value = p.roofL;
      if (document.getElementById('roofType')) document.getElementById('roofType').value = p.roofType;
      if (document.getElementById('roofMargin')) document.getElementById('roofMargin').value = p.roofMargin;
      if (document.getElementById('roofOrientation')) document.getElementById('roofOrientation').value = p.roofOrientation || 'south';
      if (document.getElementById('panelPreset')) document.getElementById('panelPreset').value = p.panelPreset;
      if (document.getElementById('panelW')) document.getElementById('panelW').value = p.panelW;
      if (document.getElementById('panelL')) document.getElementById('panelL').value = p.panelL;
      if (document.getElementById('buildingFloor')) document.getElementById('buildingFloor').value = p.buildingFloor;
      if (document.getElementById('horizCableRun')) document.getElementById('horizCableRun').value = p.horizCableRun;
      if (document.getElementById('inverterLocation')) document.getElementById('inverterLocation').value = p.inverterLocation;
      if (document.getElementById('peaMeterSize')) document.getElementById('peaMeterSize').value = p.peaMeterSize || '1p_15_45';
      if (document.getElementById('batteryCapacity')) document.getElementById('batteryCapacity').value = p.batteryCapacity || '5';

      if (p.panelOrient) {
        const orientRadio = document.querySelector(`input[name="panelOrient"][value="${p.panelOrient}"]`);
        if (orientRadio) orientRadio.checked = true;
      }

      if (p.systemType) {
        const sysRadio = document.querySelector(`input[name="systemType"][value="${p.systemType}"]`);
        if (sysRadio) sysRadio.checked = true;
        const batteryOptionsRow = document.getElementById('batteryOptionsRow');
        if (batteryOptionsRow) batteryOptionsRow.classList.toggle('hidden', p.systemType !== 'hybrid');
      }

      disabledPanels = new Set(p.disabledPanels || []);
      runPlanner();
      showToast(`โหลดโครงการ "${p.name}" เรียบร้อยแล้ว`);
    });
  }

  // Copy Summary to LINE
  if (btnCopyLine) {
    btnCopyLine.addEventListener('click', () => {
      const name = projectCustomerName?.value.trim() || 'ลูกค้าทั่วไป';
      const panels = document.getElementById('badgeTotalPanels')?.textContent || '0';
      const kw = document.getElementById('badgeTotalKw')?.textContent || '0.00';
      const panelWatt = document.getElementById('dispPanelWatt')?.textContent || '650W';
      const roofDim = document.getElementById('dispRoofDim')?.textContent || '10.0 x 6.0 ม.';
      const roofType = document.getElementById('bomHeaderRoofType')?.textContent || 'หลังคาเมทัลชีท';
      const floors = document.getElementById('buildingFloor')?.value || '2';
      const invCap = document.getElementById('diagInverterSize')?.textContent || '5 kW';
      const systemType = document.querySelector('input[name="systemType"]:checked')?.value === 'hybrid' ? 'Hybrid + แบตเตอรี่ LiFePO4' : 'On-Grid ต่อสายส่ง กฟภ.';
      const monthlySavings = document.getElementById('roiMonthlySavings')?.textContent || '฿0';
      const paybackYears = document.getElementById('roiPaybackYears')?.textContent || '0 ปี';
      const grandTotal = document.getElementById('quoteGrandTotal')?.textContent || '฿0';

      const lineText = 
`⚡ สรุปแบบแปลน & ใบเสนอราคาโซลาร์เซลล์ 99 Solar ⚡
━━━━━━━━━━━━━━━━━━
🏠 โครงการ: ${name}
📏 ขนาดหลังคา: ${roofDim} (${roofType})
🏢 ความสูงอาคาร: ${floors} ชั้น
☀️ ขนาดระบบ: ${kw} kWp (${panels} แผง / ${panelWatt})
⚙️ ประเภทระบบ: ${systemType}
🔌 อินเวอร์เตอร์: ${invCap} (มาตรฐาน กฟภ. 100%)
━━━━━━━━━━━━━━━━━━
💰 ประมาณการราคา: ${grandTotal} บาท (รวมติดตั้งและขออนุญาต)
💵 ประหยัดค่าไฟ: ${monthlySavings}
⏳ ระยะเวลาคืนทุน: ~${paybackYears}
━━━━━━━━━━━━━━━━━━
✅ รับประกันแผง 25-30 ปี / Inverter 5-10 ปี
✅ ฟรีล้างแผงตรวจเช็คระบบ 2 ปี
👷‍♂️ ควบคุมงานโดยวิศวกร กว. (บจก. 99 แมทช์ เมคเกอร์ หาดใหญ่)
📞 โทร: 089-466-1491 | LINE: @99sola`;

      try {
        navigator.clipboard.writeText(lineText);
      } catch (err) {}
      
      showToast('คัดลอกสรุปใบเสนอราคาแล้ว กำลังเปิด LINE...');
      
      const lineUrl = `https://line.me/R/oaMessage/@99sola/?${encodeURIComponent(lineText)}`;
      setTimeout(() => {
        window.open(lineUrl, '_blank');
      }, 400);
    });
  }

  refreshProjectsDropdown();
}

// -------------------------------------------------------------
// MAIN PLANNER ENGINE
// -------------------------------------------------------------
function runPlanner() {
  const roofW = parseFloat(document.getElementById('roofWidth')?.value) || 10.0;
  const roofL = parseFloat(document.getElementById('roofLength')?.value) || 6.0;
  const roofType = document.getElementById('roofType')?.value || 'metalthru';
  const margin = parseFloat(document.getElementById('roofMargin')?.value) || 0.5;
  const orientationSetting = document.getElementById('roofOrientation')?.value || 'south';
  const panelWatt = parseInt(document.getElementById('panelPreset')?.value) || 650;
  const panelW = parseFloat(document.getElementById('panelW')?.value) || 1.134;
  const panelL = parseFloat(document.getElementById('panelL')?.value) || 2.384;
  const orientation = document.querySelector('input[name="panelOrient"]:checked')?.value || 'portrait';
  const floors = parseInt(document.getElementById('buildingFloor')?.value) || 2;
  const horizCable = parseFloat(document.getElementById('horizCableRun')?.value) || 12;
  const invLocation = document.getElementById('inverterLocation')?.value || 'ground';
  const peaMeter = document.getElementById('peaMeterSize')?.value || '1p_15_45';
  const systemType = document.querySelector('input[name="systemType"]:checked')?.value || 'ongrid';
  const batteryCap = parseInt(document.getElementById('batteryCapacity')?.value) || 5;

  // 1. Calculate usable dimensions inside setback margin
  const usableW = Math.max(0, roofW - (2 * margin));
  const usableL = Math.max(0, roofL - (2 * margin));

  let effW = orientation === 'portrait' ? panelW : panelL;
  let effL = orientation === 'portrait' ? panelL : panelW;

  const gap = 0.025;
  let cols = Math.floor((usableW + gap) / (effW + gap));
  let rows = Math.floor((usableL + gap) / (effL + gap));

  cols = Math.max(0, cols);
  rows = Math.max(0, rows);
  const maxPossiblePanels = cols * rows;

  const validDisabled = new Set([...disabledPanels].filter(idx => idx < maxPossiblePanels));
  const activePanels = Math.max(0, maxPossiblePanels - validDisabled.size);

  const totalKwNum = (activePanels * panelWatt) / 1000;
  const totalKw = totalKwNum.toFixed(2);
  const totalRoofArea = (roofW * roofL).toFixed(1);
  const totalPanelArea = (activePanels * (panelW * panelL)).toFixed(1);
  const coveragePct = totalRoofArea > 0 ? ((totalPanelArea / totalRoofArea) * 100).toFixed(1) : 0;

  // Electrical Strings Calculation
  const vocPerPanel = 55.5;
  const vmpPerPanel = 46.5;

  let numStrings = 1;
  let panelsPerString = activePanels;
  let totalVoc = Math.round(activePanels * vocPerPanel);
  let totalVmp = Math.round(activePanels * vmpPerPanel);

  if (activePanels > 10) {
    numStrings = 2;
    panelsPerString = Math.ceil(activePanels / 2);
    totalVoc = Math.round(panelsPerString * vocPerPanel);
    totalVmp = Math.round(panelsPerString * vmpPerPanel);
  }

  // Suitable Inverter Capacity Selection
  let invCap = '3.3 kW (1 Phase)';
  let invMaxVoc = 600;
  let is3Phase = false;

  if (totalKwNum > 15) { invCap = '20 kW (3 Phase)'; invMaxVoc = 1000; is3Phase = true; }
  else if (totalKwNum > 11) { invCap = '15 kW (3 Phase)'; invMaxVoc = 1000; is3Phase = true; }
  else if (totalKwNum > 8) { invCap = '10 kW (3 Phase)'; invMaxVoc = 1000; is3Phase = true; }
  else if (totalKwNum > 5.5) { invCap = '8 kW (3 Phase/1 Phase)'; invMaxVoc = 600; is3Phase = peaMeter.startsWith('3p'); }
  else if (totalKwNum > 3.6) { invCap = '5 kW (1 Phase/3 Phase)'; invMaxVoc = 600; is3Phase = peaMeter.startsWith('3p'); }
  else { invCap = '3.3 kW (1 Phase)'; invMaxVoc = 550; is3Phase = false; }

  // PEA Meter Quota Verification
  let meterLimitKw = 5.0;
  let meterName = '1 เฟส 15(45)A';
  if (peaMeter === '1p_30_100') { meterLimitKw = 10.0; meterName = '1 เฟส 30(100)A'; }
  else if (peaMeter === '3p_15_45') { meterLimitKw = 10.0; meterName = '3 เฟส 15(45)A'; is3Phase = true; }
  else if (peaMeter === '3p_30_100') { meterLimitKw = 30.0; meterName = '3 เฟส 30(100)A'; is3Phase = true; }

  const peaQuotaBadge = document.getElementById('peaQuotaBadge');
  const peaNoticeMsg = document.getElementById('peaNoticeMsg');

  if (totalKwNum <= meterLimitKw) {
    if (peaQuotaBadge) {
      peaQuotaBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900 text-emerald-300 border border-emerald-700';
      peaQuotaBadge.textContent = '🟢 ผ่านเกณฑ์ กฟภ. 100%';
    }
    if (peaNoticeMsg) {
      peaNoticeMsg.innerHTML = `มิเตอร์ไฟฟ้าเดิม <strong>${meterName}</strong> รองรับกำลังผลิตไม่เกิน <strong>${meterLimitKw} kWp</strong> (ระบบนี้ ${totalKw} kWp ยื่นขนานไฟ กฟภ. ได้ทันที)`;
    }
  } else {
    if (peaQuotaBadge) {
      peaQuotaBadge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-900 text-amber-300 border border-amber-700';
      peaQuotaBadge.textContent = '⚠️ เกินโควต้ามิเตอร์เดิม';
    }
    if (peaNoticeMsg) {
      peaNoticeMsg.innerHTML = `ระบบ ${totalKw} kWp เกินเกณฑ์ ${meterLimitKw} kWp ของมิเตอร์ ${meterName} $\\rightarrow$ แนะนำแจ้งขยายมิเตอร์เป็น 30(100)A หรือเปลี่ยนเป็นไฟ 3 เฟส`;
    }
  }

  // Quick Electrical Sizing (วสท. Standards)
  let acCurrent = 0;
  let recommendedMcb = '2P 32A';
  let recommendedCable = 'NYY / CV 6 sq.mm.';

  if (is3Phase) {
    acCurrent = ((totalKwNum * 1000) / (Math.sqrt(3) * 400 * 0.95)) || 0;
    if (acCurrent > 40) { recommendedMcb = '3P 50A / 63A'; recommendedCable = 'NYY / CV 16 sq.mm.'; }
    else if (acCurrent > 25) { recommendedMcb = '3P 32A / 40A'; recommendedCable = 'NYY / CV 10 sq.mm.'; }
    else if (acCurrent > 16) { recommendedMcb = '3P 20A / 25A'; recommendedCable = 'NYY / CV 6 sq.mm.'; }
    else { recommendedMcb = '3P 16A'; recommendedCable = 'NYY / CV 4 sq.mm.'; }
  } else {
    acCurrent = ((totalKwNum * 1000) / (230 * 0.95)) || 0;
    if (acCurrent > 40) { recommendedMcb = '2P 50A / 63A'; recommendedCable = 'NYY / CV 16 sq.mm.'; }
    else if (acCurrent > 25) { recommendedMcb = '2P 40A'; recommendedCable = 'NYY / CV 10 sq.mm.'; }
    else if (acCurrent > 18) { recommendedMcb = '2P 32A'; recommendedCable = 'NYY / CV 6 sq.mm.'; }
    else { recommendedMcb = '2P 20A'; recommendedCable = 'NYY / CV 4 sq.mm.'; }
  }

  const specAcCurrent = document.getElementById('specAcCurrent');
  if (specAcCurrent) specAcCurrent.textContent = `${acCurrent.toFixed(1)} A`;
  const specAcMcb = document.getElementById('specAcMcb');
  if (specAcMcb) specAcMcb.textContent = recommendedMcb;
  const specAcCable = document.getElementById('specAcCable');
  if (specAcCable) specAcCable.textContent = recommendedCable;

  // MPPT Safety Banner
  const mpptSafetyBanner = document.getElementById('mpptSafetyBanner');
  const mpptStatusTitle = document.getElementById('mpptStatusTitle');
  const mpptBadge = document.getElementById('mpptBadge');
  const mpptDesc = document.getElementById('mpptDesc');
  const statMpptVoc = document.getElementById('statMpptVoc');
  const statMpptVmp = document.getElementById('statMpptVmp');
  const mpptIconWrap = document.getElementById('mpptIconWrap');

  if (statMpptVoc) statMpptVoc.textContent = `${totalVoc}V`;
  if (statMpptVmp) statMpptVmp.textContent = `${totalVmp}V`;

  if (totalVoc <= invMaxVoc && activePanels > 0) {
    if (mpptSafetyBanner) mpptSafetyBanner.className = 'mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs';
    if (mpptIconWrap) mpptIconWrap.className = 'w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg shrink-0';
    if (mpptStatusTitle) mpptStatusTitle.textContent = 'การจับคู่แรงดัน MPPT สมบูรณ์แบบ (100% Inverter Safe Match)';
    if (mpptBadge) {
      mpptBadge.textContent = 'SAFE';
      mpptBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
    }
    if (mpptDesc) mpptDesc.textContent = `แรงดัน Voc (${totalVoc}V) อยู่ในช่วงทำงาน MPPT สูงสุดของ Inverter ${invCap} ปลอดภัยตามมาตรฐาน กฟภ. และ วสท.`;
  } else if (activePanels > 0) {
    if (mpptSafetyBanner) mpptSafetyBanner.className = 'mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs';
    if (mpptIconWrap) mpptIconWrap.className = 'w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center text-lg shrink-0';
    if (mpptStatusTitle) mpptStatusTitle.textContent = 'ข้อแนะนำทางวิศวกรรม: แรงดันใกล้ขีดจำกัด Inverter';
    if (mpptBadge) {
      mpptBadge.textContent = 'CHECK';
      mpptBadge.className = 'px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300';
    }
    if (mpptDesc) mpptDesc.textContent = `แนะนำให้แยกเป็น 2 สตริงย่อย เพื่อป้องกัน Overvoltage`;
  }

  // Cable Lengths
  let vertRun = floors * 4;
  if (invLocation === 'upper' && floors > 1) {
    vertRun = Math.max(4, (floors - 1) * 4);
  } else if (invLocation === 'attic') {
    vertRun = 3;
  }

  const roofWiringSlack = activePanels * 1.2;
  const oneWayDC = Math.round((vertRun + horizCable + roofWiringSlack) * 1.15);
  const totalDCCable = Math.max(10, oneWayDC * 2 * numStrings);
  const groundingCable = Math.round(vertRun + horizCable + (roofW * 0.8) + 8);
  const acCable = Math.round(horizCable * 1.2 + 6);
  const emtConduit = Math.round(vertRun + horizCable + 4);

  // Update Top & Stat Badges
  const badgeTotalPanels = document.getElementById('badgeTotalPanels');
  if (badgeTotalPanels) badgeTotalPanels.textContent = activePanels;
  const badgeTotalKw = document.getElementById('badgeTotalKw');
  if (badgeTotalKw) badgeTotalKw.textContent = totalKw;

  const dispRoofDim = document.getElementById('dispRoofDim');
  if (dispRoofDim) dispRoofDim.textContent = `${roofW.toFixed(1)} x ${roofL.toFixed(1)} ม.`;
  const dispRoofArea = document.getElementById('dispRoofArea');
  if (dispRoofArea) dispRoofArea.textContent = totalRoofArea;
  const dispPanelWatt = document.getElementById('dispPanelWatt');
  if (dispPanelWatt) dispPanelWatt.textContent = `${panelWatt}W`;
  const dispPanelDim = document.getElementById('dispPanelDim');
  if (dispPanelDim) dispPanelDim.textContent = `${panelL.toFixed(2)} x ${panelW.toFixed(2)} ม.`;

  const dispElevationFloor = document.getElementById('dispElevationFloor');
  if (dispElevationFloor) dispElevationFloor.textContent = `${floors} ชั้น (~${floors * 4} เมตร)`;

  const statGridRowCol = document.getElementById('statGridRowCol');
  if (statGridRowCol) statGridRowCol.textContent = `${rows} แถว x ${cols} คอลัมน์`;
  const statPanelArea = document.getElementById('statPanelArea');
  if (statPanelArea) statPanelArea.textContent = `${totalPanelArea} ตร.ม.`;
  const statRoofCoverage = document.getElementById('statRoofCoverage');
  if (statRoofCoverage) statRoofCoverage.textContent = `${coveragePct}% ของหลังคา`;
  const statStringConfig = document.getElementById('statStringConfig');
  if (statStringConfig) {
    statStringConfig.textContent = activePanels > 0 
      ? `${numStrings} สตริง (${panelsPerString} แผง/สตริง)` 
      : '0 สตริง';
  }

  // Update Single Line Diagram Text
  const diagPanelsTxt = document.getElementById('diagPanelsTxt');
  if (diagPanelsTxt) diagPanelsTxt.textContent = `${activePanels} แผง (${panelWatt}W)`;
  const diagVocTxt = document.getElementById('diagVocTxt');
  if (diagVocTxt) diagVocTxt.textContent = `Voc: ~${totalVoc}V DC (${numStrings} String)`;
  const diagInverterSize = document.getElementById('diagInverterSize');
  if (diagInverterSize) diagInverterSize.textContent = invCap;
  const diagDCLength = document.getElementById('diagDCLength');
  if (diagDCLength) diagDCLength.textContent = `~${totalDCCable} เมตร (รวมสายดำ/แดง)`;

  // Render SVG 2D Sketch
  renderRoofSvg(roofW, roofL, margin, rows, cols, effW, effL, gap, maxPossiblePanels, roofType, orientation);

  // Render Building Elevation SVG
  renderElevationSvg(floors, activePanels, totalKw, horizCable, vertRun, invLocation, roofType, systemType, batteryCap);

  // Render BOM Table
  renderBOMTable(activePanels, panelWatt, totalKw, roofType, rows, cols, invCap, totalDCCable, groundingCable, acCable, floors, emtConduit, systemType, batteryCap);

  // Render Customer Quotation & ROI Table
  renderQuotationTable(activePanels, panelWatt, totalKwNum, invCap, roofType, floors, orientationSetting, systemType, batteryCap);
}

// -------------------------------------------------------------
// 1. Render SVG 2D Roof Sketch & Structural Rails
// -------------------------------------------------------------
function renderRoofSvg(roofW, roofL, margin, rows, cols, effW, effL, gap, maxPossiblePanels, roofType, orientation) {
  const svg = document.getElementById('roofSvgCanvas');
  if (!svg) return;

  const svgW = 800;
  const svgH = 460;
  svg.innerHTML = '';

  const paddingX = 80;
  const paddingY = 60;
  const maxDrawW = svgW - (paddingX * 2);
  const maxDrawH = svgH - (paddingY * 2);

  const scale = Math.min(maxDrawW / roofW, maxDrawH / roofL);
  const drawRoofW = roofW * scale;
  const drawRoofL = roofL * scale;

  const startX = (svgW - drawRoofW) / 2;
  const startY = (svgH - drawRoofL) / 2;

  // SVG Definitions
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <pattern id="metalRibs" width="16" height="16" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#1e293b"/>
      <line x1="0" y1="0" x2="0" y2="16" stroke="#334155" stroke-width="1.5"/>
    </pattern>
    <pattern id="tileTexture" width="24" height="16" patternUnits="userSpaceOnUse">
      <rect width="24" height="16" fill="#334155"/>
      <rect x="0" y="0" width="24" height="16" fill="none" stroke="#475569" stroke-width="1"/>
    </pattern>
    <pattern id="carportTexture" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#0f172a"/>
      <line x1="0" y1="0" x2="20" y2="0" stroke="#38bdf8" stroke-width="1" opacity="0.4"/>
      <line x1="0" y1="0" x2="0" y2="20" stroke="#475569" stroke-width="0.8"/>
    </pattern>
    <linearGradient id="panelGradSvg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="60%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="railGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  `;
  svg.appendChild(defs);

  // 1. Draw Roof Outer Boundary
  const roofRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  roofRect.setAttribute('x', startX);
  roofRect.setAttribute('y', startY);
  roofRect.setAttribute('width', drawRoofW);
  roofRect.setAttribute('height', drawRoofL);
  roofRect.setAttribute('rx', '6');
  
  let roofFill = 'url(#metalRibs)';
  if (roofType === 'cpac' || roofType === 'corrugated') roofFill = 'url(#tileTexture)';
  else if (roofType === 'carport' || roofType === 'ground') roofFill = 'url(#carportTexture)';
  else if (roofType === 'concrete') roofFill = '#334155';

  roofRect.setAttribute('fill', roofFill);
  roofRect.setAttribute('stroke', '#64748b');
  roofRect.setAttribute('stroke-width', '2');
  svg.appendChild(roofRect);

  // 2. Draw Setback Safe Boundary
  if (margin > 0) {
    const marginPx = margin * scale;
    const setback = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    setback.setAttribute('x', startX + marginPx);
    setback.setAttribute('y', startY + marginPx);
    setback.setAttribute('width', Math.max(0, drawRoofW - (2 * marginPx)));
    setback.setAttribute('height', Math.max(0, drawRoofL - (2 * marginPx)));
    setback.setAttribute('fill', 'rgba(245, 158, 11, 0.04)');
    setback.setAttribute('stroke', '#f59e0b');
    setback.setAttribute('stroke-width', '1.5');
    setback.setAttribute('stroke-dasharray', '5 4');
    setback.setAttribute('rx', '4');
    svg.appendChild(setback);
  }

  // 3. Draw Array of Solar Panels & Rails
  const drawPanelW = effW * scale;
  const drawPanelL = effL * scale;
  const drawGap = gap * scale;

  const totalArrayW = (cols * drawPanelW) + ((cols - 1) * drawGap);
  const totalArrayL = (rows * drawPanelL) + ((rows - 1) * drawGap);

  const arrayStartX = startX + ((drawRoofW - totalArrayW) / 2);
  const arrayStartY = startY + ((drawRoofL - totalArrayL) / 2);

  // Draw Dual Aluminum Rails behind panels if enabled
  if (showRails && cols > 0 && rows > 0) {
    const railOverhang = 8;
    for (let r = 0; r < rows; r++) {
      const py = arrayStartY + r * (drawPanelL + drawGap);
      const rail1Y = py + drawPanelL * 0.22;
      const rail2Y = py + drawPanelL * 0.78;

      [rail1Y, rail2Y].forEach(ry => {
        const railRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        railRect.setAttribute('x', arrayStartX - railOverhang);
        railRect.setAttribute('y', ry - 2.5);
        railRect.setAttribute('width', totalArrayW + railOverhang * 2);
        railRect.setAttribute('height', '5');
        railRect.setAttribute('fill', 'url(#railGrad)');
        railRect.setAttribute('rx', '1.5');
        railRect.setAttribute('opacity', '0.85');
        railRect.setAttribute('stroke', '#d97706');
        railRect.setAttribute('stroke-width', '0.8');
        svg.appendChild(railRect);
      });
    }
  }

  let panelIndex = 0;
  const activePanelCenters = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = panelIndex;
      const px = arrayStartX + c * (drawPanelW + drawGap);
      const py = arrayStartY + r * (drawPanelL + drawGap);
      const isDisabled = disabledPanels.has(idx);

      const panelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      panelGroup.style.cursor = 'pointer';
      panelGroup.onclick = () => {
        if (disabledPanels.has(idx)) {
          disabledPanels.delete(idx);
        } else {
          disabledPanels.add(idx);
        }
        runPlanner();
      };

      const panel = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      panel.setAttribute('x', px);
      panel.setAttribute('y', py);
      panel.setAttribute('width', drawPanelW);
      panel.setAttribute('height', drawPanelL);
      panel.setAttribute('rx', '2.5');

      if (isDisabled) {
        panel.setAttribute('fill', 'rgba(239, 68, 68, 0.15)');
        panel.setAttribute('stroke', '#ef4444');
        panel.setAttribute('stroke-width', '1.5');
        panel.setAttribute('stroke-dasharray', '4 3');
      } else {
        panel.setAttribute('fill', 'url(#panelGradSvg)');
        panel.setAttribute('stroke', '#38bdf8');
        panel.setAttribute('stroke-width', '1');
      }
      panelGroup.appendChild(panel);

      if (!isDisabled) {
        const subLine1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        subLine1.setAttribute('x1', px + drawPanelW / 2);
        subLine1.setAttribute('y1', py);
        subLine1.setAttribute('x2', px + drawPanelW / 2);
        subLine1.setAttribute('y2', py + drawPanelL);
        subLine1.setAttribute('stroke', '#38bdf8');
        subLine1.setAttribute('stroke-width', '0.6');
        subLine1.setAttribute('stroke-dasharray', '2 2');
        panelGroup.appendChild(subLine1);

        const numTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        numTxt.setAttribute('x', px + drawPanelW / 2);
        numTxt.setAttribute('y', py + drawPanelL / 2 + 3);
        numTxt.setAttribute('fill', '#ffffff');
        numTxt.setAttribute('font-size', '9');
        numTxt.setAttribute('font-weight', 'bold');
        numTxt.setAttribute('text-anchor', 'middle');
        numTxt.setAttribute('font-family', 'monospace');
        numTxt.textContent = `#${idx + 1}`;
        panelGroup.appendChild(numTxt);

        activePanelCenters.push({ x: px + drawPanelW / 2, y: py + drawPanelL / 2 });
      } else {
        const xTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xTxt.setAttribute('x', px + drawPanelW / 2);
        xTxt.setAttribute('y', py + drawPanelL / 2 + 4);
        xTxt.setAttribute('fill', '#f87171');
        xTxt.setAttribute('font-size', '10');
        xTxt.setAttribute('font-weight', 'bold');
        xTxt.setAttribute('text-anchor', 'middle');
        xTxt.textContent = '✕ เว้น';
        panelGroup.appendChild(xTxt);
      }

      svg.appendChild(panelGroup);
      panelIndex++;
    }
  }

  // 4. Draw DC String Wiring Path
  if (activePanelCenters.length > 1) {
    let pathD = `M ${activePanelCenters[0].x} ${activePanelCenters[0].y}`;
    for (let i = 1; i < activePanelCenters.length; i++) {
      pathD += ` L ${activePanelCenters[i].x} ${activePanelCenters[i].y}`;
    }
    const stringPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    stringPath.setAttribute('d', pathD);
    stringPath.setAttribute('fill', 'none');
    stringPath.setAttribute('stroke', '#10b981');
    stringPath.setAttribute('stroke-width', '2');
    stringPath.setAttribute('stroke-dasharray', '4 4');
    stringPath.setAttribute('opacity', '0.9');
    svg.appendChild(stringPath);
  }

  // 5. Dimension Lines (Width & Length Arrows)
  drawDimensionLine(svg, startX, startY - 22, startX + drawRoofW, startY - 22, `กว้าง ${roofW.toFixed(1)} ม.`);
  drawDimensionLine(svg, startX - 22, startY, startX - 22, startY + drawRoofL, `ยาว ${roofL.toFixed(1)} ม.`, true);
}

function drawDimensionLine(svg, x1, y1, x2, y2, label, isVertical = false) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', x1); line.setAttribute('y1', y1);
  line.setAttribute('x2', x2); line.setAttribute('y2', y2);
  line.setAttribute('stroke', '#94a3b8'); line.setAttribute('stroke-width', '1');
  svg.appendChild(line);

  const tick1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  const tick2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  if (isVertical) {
    tick1.setAttribute('x1', x1 - 4); tick1.setAttribute('y1', y1); tick1.setAttribute('x2', x1 + 4); tick1.setAttribute('y2', y1);
    tick2.setAttribute('x1', x2 - 4); tick2.setAttribute('y1', y2); tick2.setAttribute('x2', x2 + 4); tick2.setAttribute('y2', y2);
  } else {
    tick1.setAttribute('x1', x1); tick1.setAttribute('y1', y1 - 4); tick1.setAttribute('x2', x1); tick1.setAttribute('y2', y1 + 4);
    tick2.setAttribute('x1', x2); tick2.setAttribute('y1', y2 - 4); tick2.setAttribute('x2', x2); tick2.setAttribute('y2', y2 + 4);
  }
  tick1.setAttribute('stroke', '#94a3b8'); tick1.setAttribute('stroke-width', '1');
  tick2.setAttribute('stroke', '#94a3b8'); tick2.setAttribute('stroke-width', '1');
  svg.appendChild(tick1);
  svg.appendChild(tick2);

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', (x1 + x2) / 2);
  text.setAttribute('y', isVertical ? (y1 + y2) / 2 + 4 : y1 - 6);
  text.setAttribute('fill', '#cbd5e1');
  text.setAttribute('font-size', '10');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-family', 'Kanit, sans-serif');
  text.textContent = label;
  svg.appendChild(text);
}

// -------------------------------------------------------------
// 2. Render Building Elevation SVG (Cross-Section & Conduit Sim)
// -------------------------------------------------------------
function renderElevationSvg(floors, totalPanels, totalKw, horizCable, vertRun, invLocation, roofType, systemType, batteryCap) {
  const svg = document.getElementById('elevationSvgCanvas');
  if (!svg) return;

  const svgW = 800;
  const svgH = 460;
  svg.innerHTML = '';

  const groundY = 380;
  const houseLeft = 130;
  const houseWidth = 350;
  const floorHeight = Math.min(75, 230 / floors);
  const houseHeight = floors * floorHeight;
  const houseTopY = groundY - houseHeight;

  // 1. Underground Layer & Ground Line
  const earthRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  earthRect.setAttribute('x', 0);
  earthRect.setAttribute('y', groundY);
  earthRect.setAttribute('width', svgW);
  earthRect.setAttribute('height', svgH - groundY);
  earthRect.setAttribute('fill', '#0f172a');
  svg.appendChild(earthRect);

  const groundLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  groundLine.setAttribute('x1', 0); groundLine.setAttribute('y1', groundY);
  groundLine.setAttribute('x2', svgW); groundLine.setAttribute('y2', groundY);
  groundLine.setAttribute('stroke', '#334155'); groundLine.setAttribute('stroke-width', '2');
  svg.appendChild(groundLine);

  const gText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  gText.setAttribute('x', 50); gText.setAttribute('y', groundY + 18);
  gText.setAttribute('fill', '#64748b'); gText.setAttribute('font-size', '10');
  gText.setAttribute('font-family', 'Kanit, sans-serif');
  gText.textContent = 'ระดับพื้นดิน (Ground Level ±0.00)';
  svg.appendChild(gText);

  // 2. Building Body & Floors
  const bldgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bldgRect.setAttribute('x', houseLeft);
  bldgRect.setAttribute('y', houseTopY);
  bldgRect.setAttribute('width', houseWidth);
  bldgRect.setAttribute('height', houseHeight);
  bldgRect.setAttribute('fill', '#1e293b');
  bldgRect.setAttribute('stroke', '#475569');
  bldgRect.setAttribute('stroke-width', '2');
  svg.appendChild(bldgRect);

  for (let f = 1; f <= floors; f++) {
    const fY = groundY - (f * floorHeight);
    if (f < floors) {
      const flLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      flLine.setAttribute('x1', houseLeft); flLine.setAttribute('y1', fY);
      flLine.setAttribute('x2', houseLeft + houseWidth); flLine.setAttribute('y2', fY);
      flLine.setAttribute('stroke', '#334155'); flLine.setAttribute('stroke-width', '1.5');
      flLine.setAttribute('stroke-dasharray', '4 3');
      svg.appendChild(flLine);
    }

    const fBadge = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    fBadge.setAttribute('x', houseLeft + 20);
    fBadge.setAttribute('y', groundY - ((f - 0.5) * floorHeight) + 4);
    fBadge.setAttribute('fill', '#94a3b8');
    fBadge.setAttribute('font-size', '11');
    fBadge.setAttribute('font-weight', 'bold');
    fBadge.setAttribute('font-family', 'Kanit, sans-serif');
    fBadge.textContent = `ชั้น ${f}`;
    svg.appendChild(fBadge);
  }

  // 3. Roof Structure
  const roofApexX = houseLeft + (houseWidth * 0.45);
  const roofApexY = houseTopY - 45;
  const roofEaveLeftX = houseLeft - 25;
  const roofEaveRightX = houseLeft + houseWidth + 20;

  const roofPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  roofPoly.setAttribute('points', `${roofEaveLeftX},${houseTopY} ${roofApexX},${roofApexY} ${roofEaveRightX},${houseTopY}`);
  roofPoly.setAttribute('fill', '#0f172a');
  roofPoly.setAttribute('stroke', '#64748b');
  roofPoly.setAttribute('stroke-width', '2');
  svg.appendChild(roofPoly);

  // 4. Solar Panels on the Roof Slope
  const panelStartX = roofEaveLeftX + 20;
  const panelStartY = houseTopY - 8;
  const panelEndX = roofApexX - 12;
  const panelEndY = roofApexY + 8;

  const pvLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  pvLine.setAttribute('x1', panelStartX); pvLine.setAttribute('y1', panelStartY);
  pvLine.setAttribute('x2', panelEndX); pvLine.setAttribute('y2', panelEndY);
  pvLine.setAttribute('stroke', '#0284c7'); pvLine.setAttribute('stroke-width', '7');
  pvLine.setAttribute('stroke-linecap', 'round');
  svg.appendChild(pvLine);

  const pvLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  pvLabel.setAttribute('x', (panelStartX + panelEndX) / 2 - 15);
  pvLabel.setAttribute('y', (panelStartY + panelEndY) / 2 - 12);
  pvLabel.setAttribute('fill', '#38bdf8');
  pvLabel.setAttribute('font-size', '10');
  pvLabel.setAttribute('font-weight', 'bold');
  pvLabel.setAttribute('font-family', 'Kanit, sans-serif');
  pvLabel.textContent = `แผงโซลาร์เซลล์ (${totalPanels} แผง / ${totalKw} kWp)`;
  svg.appendChild(pvLabel);

  // 5. Conduit Path (EMT Metallic Conduit)
  const conduitX = houseLeft + houseWidth + 12;
  const topConduitY = houseTopY - 4;
  
  let targetInvY = groundY - 50;
  if (invLocation === 'upper' && floors > 1) {
    targetInvY = groundY - (1.5 * floorHeight);
  }

  const pipePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  pipePath.setAttribute('d', `M ${panelEndX} ${panelEndY} L ${conduitX} ${topConduitY} L ${conduitX} ${targetInvY}`);
  pipePath.setAttribute('fill', 'none');
  pipePath.setAttribute('stroke', '#cbd5e1');
  pipePath.setAttribute('stroke-width', '4');
  pipePath.setAttribute('stroke-linecap', 'round');
  svg.appendChild(pipePath);

  const dcWire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  dcWire.setAttribute('d', `M ${panelEndX} ${panelEndY} L ${conduitX} ${topConduitY} L ${conduitX} ${targetInvY}`);
  dcWire.setAttribute('fill', 'none');
  dcWire.setAttribute('stroke', '#f59e0b');
  dcWire.setAttribute('stroke-width', '1.8');
  dcWire.setAttribute('stroke-dasharray', '4 3');
  svg.appendChild(dcWire);

  const jBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  jBox.setAttribute('x', conduitX - 5); jBox.setAttribute('y', topConduitY - 5);
  jBox.setAttribute('width', '10'); jBox.setAttribute('height', '10');
  jBox.setAttribute('fill', '#94a3b8'); jBox.setAttribute('rx', '2');
  svg.appendChild(jBox);

  drawDimensionLine(svg, conduitX + 30, topConduitY, conduitX + 30, targetInvY, `ท่อดิ่ง EMT ~${vertRun} ม.`, true);

  // 6. DC Combiner Box
  const combinerX = conduitX + 18;
  const combinerY = targetInvY - 35;
  const cBox = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  cBox.setAttribute('x', combinerX); cBox.setAttribute('y', combinerY);
  cBox.setAttribute('width', '45'); cBox.setAttribute('height', '45');
  cBox.setAttribute('fill', '#334155'); cBox.setAttribute('stroke', '#f59e0b');
  cBox.setAttribute('stroke-width', '1.5'); cBox.setAttribute('rx', '4');
  svg.appendChild(cBox);

  const cTxt1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  cTxt1.setAttribute('x', combinerX + 22); cTxt1.setAttribute('y', combinerY + 18);
  cTxt1.setAttribute('fill', '#fbbf24'); cTxt1.setAttribute('font-size', '7.5');
  cTxt1.setAttribute('font-weight', 'bold'); cTxt1.setAttribute('text-anchor', 'middle');
  cTxt1.textContent = 'COMBINER';
  svg.appendChild(cTxt1);

  const cTxt2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  cTxt2.setAttribute('x', combinerX + 22); cTxt2.setAttribute('y', combinerY + 32);
  cTxt2.setAttribute('fill', '#94a3b8'); cTxt2.setAttribute('font-size', '6.5');
  cTxt2.setAttribute('text-anchor', 'middle');
  cTxt2.textContent = 'SPD+FUSE';
  svg.appendChild(cTxt2);

  // 7. On-Grid / Hybrid Inverter Unit
  const invX = combinerX + 55;
  const invY = combinerY - 10;
  const invRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  invRect.setAttribute('x', invX); invRect.setAttribute('y', invY);
  invRect.setAttribute('width', '55'); invRect.setAttribute('height', '65');
  invRect.setAttribute('fill', '#1e293b'); 
  invRect.setAttribute('stroke', systemType === 'hybrid' ? '#a855f7' : '#10b981');
  invRect.setAttribute('stroke-width', '2'); invRect.setAttribute('rx', '5');
  svg.appendChild(invRect);

  const invScreen = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  invScreen.setAttribute('x', invX + 8); invScreen.setAttribute('y', invY + 10);
  invScreen.setAttribute('width', '39'); invScreen.setAttribute('height', '18');
  invScreen.setAttribute('fill', '#022c22'); invScreen.setAttribute('stroke', '#059669');
  invScreen.setAttribute('rx', '2');
  svg.appendChild(invScreen);

  const ledText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  ledText.setAttribute('x', invX + 27); ledText.setAttribute('y', invY + 23);
  ledText.setAttribute('fill', '#34d399'); ledText.setAttribute('font-size', '7.5');
  ledText.setAttribute('font-weight', 'bold'); ledText.setAttribute('text-anchor', 'middle');
  ledText.textContent = `${totalKw} kW`;
  svg.appendChild(ledText);

  const invTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  invTitle.setAttribute('x', invX + 27); invTitle.setAttribute('y', invY + 45);
  invTitle.setAttribute('fill', '#ffffff'); invTitle.setAttribute('font-size', '7.5');
  invTitle.setAttribute('font-weight', 'bold'); invTitle.setAttribute('text-anchor', 'middle');
  invTitle.textContent = systemType === 'hybrid' ? 'HYBRID' : 'INVERTER';
  svg.appendChild(invTitle);

  // 8. If Hybrid: Draw Battery Unit
  let nextX = invX + 65;
  if (systemType === 'hybrid') {
    const batX = invX + 65;
    const batY = invY + 5;
    const batRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    batRect.setAttribute('x', batX); batRect.setAttribute('y', batY);
    batRect.setAttribute('width', '45'); batRect.setAttribute('height', '55');
    batRect.setAttribute('fill', '#2e1065'); batRect.setAttribute('stroke', '#c084fc');
    batRect.setAttribute('stroke-width', '1.5'); batRect.setAttribute('rx', '4');
    svg.appendChild(batRect);

    const batTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    batTxt.setAttribute('x', batX + 22); batTxt.setAttribute('y', batY + 22);
    batTxt.setAttribute('fill', '#e9d5ff'); batTxt.setAttribute('font-size', '7');
    batTxt.setAttribute('font-weight', 'bold'); batTxt.setAttribute('text-anchor', 'middle');
    batTxt.textContent = 'LiFePO4';
    svg.appendChild(batTxt);

    const batTxt2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    batTxt2.setAttribute('x', batX + 22); batTxt2.setAttribute('y', batY + 38);
    batTxt2.setAttribute('fill', '#f5d0fe'); batTxt2.setAttribute('font-size', '8');
    batTxt2.setAttribute('font-weight', 'bold'); batTxt2.setAttribute('text-anchor', 'middle');
    batTxt2.textContent = `${batteryCap}kWh`;
    svg.appendChild(batTxt2);

    // Battery connection to Inverter (Purple Line)
    const batLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    batLine.setAttribute('x1', invX + 55); batLine.setAttribute('y1', invY + 30);
    batLine.setAttribute('x2', batX); batLine.setAttribute('y2', invY + 30);
    batLine.setAttribute('stroke', '#c084fc'); batLine.setAttribute('stroke-width', '2.5');
    svg.appendChild(batLine);

    nextX = batX + 55;
  }

  // 9. AC MDB Distribution Panel
  const mdbX = nextX;
  const mdbY = invY + 5;
  const mdbRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  mdbRect.setAttribute('x', mdbX); mdbRect.setAttribute('y', mdbY);
  mdbRect.setAttribute('width', '45'); mdbRect.setAttribute('height', '55');
  mdbRect.setAttribute('fill', '#1e293b'); mdbRect.setAttribute('stroke', '#3b82f6');
  mdbRect.setAttribute('stroke-width', '1.5'); mdbRect.setAttribute('rx', '3');
  svg.appendChild(mdbRect);

  const mdbTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  mdbTxt.setAttribute('x', mdbX + 22); mdbTxt.setAttribute('y', mdbY + 22);
  mdbTxt.setAttribute('fill', '#60a5fa'); mdbTxt.setAttribute('font-size', '8');
  mdbTxt.setAttribute('font-weight', 'bold'); mdbTxt.setAttribute('text-anchor', 'middle');
  mdbTxt.textContent = 'ตู้ MDB';
  svg.appendChild(mdbTxt);

  const mdbTxt2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  mdbTxt2.setAttribute('x', mdbX + 22); mdbTxt2.setAttribute('y', mdbY + 36);
  mdbTxt2.setAttribute('fill', '#94a3b8'); mdbTxt2.setAttribute('font-size', '6.5');
  mdbTxt2.setAttribute('text-anchor', 'middle');
  mdbTxt2.textContent = 'ZERO EXPORT';
  svg.appendChild(mdbTxt2);

  // Connect Inverter to MDB (Blue AC line)
  const acLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  acLine.setAttribute('x1', invX + 55); acLine.setAttribute('y1', invY + 15);
  acLine.setAttribute('x2', mdbX); acLine.setAttribute('y2', invY + 15);
  acLine.setAttribute('stroke', '#3b82f6'); acLine.setAttribute('stroke-width', '2.5');
  svg.appendChild(acLine);

  // 10. Grounding System
  const rodX = combinerX + 15;
  const rodTopY = groundY;
  const rodBottomY = groundY + 60;

  const gWire = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  gWire.setAttribute('d', `M ${combinerX + 15} ${combinerY + 45} L ${rodX} ${groundY}`);
  gWire.setAttribute('fill', 'none');
  gWire.setAttribute('stroke', '#10b981');
  gWire.setAttribute('stroke-width', '2');
  gWire.setAttribute('stroke-dasharray', '3 2');
  svg.appendChild(gWire);

  const rod = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  rod.setAttribute('x1', rodX); rod.setAttribute('y1', rodTopY);
  rod.setAttribute('x2', rodX); rod.setAttribute('y2', rodBottomY);
  rod.setAttribute('stroke', '#f97316');
  rod.setAttribute('stroke-width', '4');
  rod.setAttribute('stroke-linecap', 'round');
  svg.appendChild(rod);

  const pit = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  pit.setAttribute('x', rodX - 8); pit.setAttribute('y', groundY - 2);
  pit.setAttribute('width', '16'); pit.setAttribute('height', '12');
  pit.setAttribute('fill', '#475569'); pit.setAttribute('stroke', '#64748b');
  pit.setAttribute('rx', '2');
  svg.appendChild(pit);

  const gRodTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  gRodTxt.setAttribute('x', rodX + 12); gRodTxt.setAttribute('y', rodBottomY - 15);
  gRodTxt.setAttribute('fill', '#34d399'); gRodTxt.setAttribute('font-size', '9');
  gRodTxt.setAttribute('font-family', 'Kanit, sans-serif');
  gRodTxt.textContent = 'แท่งกราวด์ทองแดง 2.4 ม. (< 5 โอห์ม)';
  svg.appendChild(gRodTxt);
}

// -------------------------------------------------------------
// 3. Render Bill of Materials (BOM) Table
// -------------------------------------------------------------
function renderBOMTable(panels, watt, kw, roofType, rows, cols, invCap, dcCable, groundCable, acCable, floors, emtConduit, systemType, batteryCap) {
  const tbody = document.getElementById('bomTableBody');
  if (!tbody) return;

  const bomHeaderKw = document.getElementById('bomHeaderKw');
  if (bomHeaderKw) bomHeaderKw.textContent = `${kw} kWp (${panels} แผง)`;
  const bomHeaderFloor = document.getElementById('bomHeaderFloor');
  if (bomHeaderFloor) bomHeaderFloor.textContent = `อาคาร ${floors} ชั้น (~${floors * 4} ม.)`;

  const roofNames = {
    metalthru: 'หลังคาเมทัลชีท (ยึด L-Feet + ยาง EPDM + กาว PU)',
    seamlock: 'หลังคาเมทัลชีท Seam-Lock (ก้ามปูหนีบลอน ไม่เจาะ 100%)',
    cpac: 'หลังคากระเบื้องซีแพคโมเนีย (Solar Tile Hook สแตนเลส 304)',
    corrugated: 'หลังคากระเบื้องลอนคู่ (Solar Hanger Bolt สแตนเลส M10)',
    concrete: 'ดาดฟ้าคอนกรีต Flat Roof (โครงปรับองศา 12-15°)',
    carport: 'โรงจอดรถ Solar Carport (ยึดแปเหล็ก/C-Channel)',
    ground: 'ติดตั้งภายนอกบนพื้นดิน Ground Mount (เสากัลวาไนซ์)'
  };

  const bomHeaderRoofType = document.getElementById('bomHeaderRoofType');
  if (bomHeaderRoofType) bomHeaderRoofType.textContent = roofNames[roofType] || roofType;

  const railsTotalMeters = Math.ceil(rows * 2 * (cols * 1.2));
  const standard42mRails = Math.max(1, Math.ceil(railsTotalMeters / 4.2));

  const endClamps = rows * 4;
  const midClamps = Math.max(0, (cols - 1) * rows * 2);

  let roofFootType = 'L-Feet สแตนเลส 304 + ยาง EPDM กันซึม';
  if (roofType === 'seamlock') roofFootType = 'Klip-Lok / Seam-Lock Clamp (ก้ามปูหนีบลอนสแตนเลส ไม่เจาะหลังคา)';
  else if (roofType === 'cpac') roofFootType = 'Solar Tile Hook สแตนเลส 304 (ขาเกี่ยวซีแพคโมเนีย)';
  else if (roofType === 'corrugated') roofFootType = 'Solar Hanger Bolt สแตนเลส M10x200 พร้อมยางกันซึม';
  else if (roofType === 'concrete') roofFootType = 'โครงขาตั้งปรับองศา Flat Roof 12-15 องศา + พุกตะกั่ว/บล็อกถ่วง';
  else if (roofType === 'carport') roofFootType = 'ชุดแคลมป์ยึดแปเหล็กโรงจอดรถ C-Channel Bracket';
  else if (roofType === 'ground') roofFootType = 'ชุดฐานรากและเสากัลวาไนซ์ Ground Mount ปรับเอียง 15 องศา';

  const roofFeetCount = Math.max(8, Math.ceil(standard42mRails * 3));
  const groundingLugs = rows * 2;
  const groundingClips = panels;
  const mc4Pairs = Math.max(4, Math.ceil((panels / 8) * 3 + 4));
  const conduitBoxes = Math.ceil(floors + 2);

  const bomItems = [
    {
      cat: '1. แผงโซลาร์เซลล์',
      name: `แผงโซลาร์เซลล์ Tier 1 Monocrystalline N-Type ขนาด ${watt}W (Half-Cell)`,
      qty: panels,
      unit: 'แผง',
      note: 'รับประกันแผง 25-30 ปี / สเปกมาตรฐาน กฟภ. และ วสท.'
    },
    {
      cat: '2. อินเวอร์เตอร์ & คอนโทรล',
      name: systemType === 'hybrid' ? `Hybrid Inverter ขนาด ${invCap} (มาตรฐาน กฟภ.)` : `On-Grid Inverter ขนาด ${invCap} (มาตรฐาน MEA/PEA)`,
      qty: 1,
      unit: 'ชุด',
      note: 'มี Built-in WiFi มอนิเตอร์ผ่านสมาร์ทโฟน 24 ชม.'
    },
    {
      cat: '2. อินเวอร์เตอร์ & คอนโทรล',
      name: 'Smart Meter + CT Sensor (ระบบป้องกันไฟย้อน Zero Export)',
      qty: 1,
      unit: 'ชุด',
      note: 'ต่อเข้าตู้เมน MDB ป้องกันไฟย้อนเข้าสายส่ง กฟภ.'
    }
  ];

  // Battery item if Hybrid
  if (systemType === 'hybrid') {
    bomItems.push({
      cat: '2. แบตเตอรี่สำรองพลังงาน',
      name: `แบตเตอรี่ลิเธียม LiFePO4 ความจุ ${batteryCap} kWh (51.2V Wall-mount พร้อม BMS อัจฉริยะ)`,
      qty: 1,
      unit: 'ชุด',
      note: 'รับประกัน 5-10 ปี / 6,000 Cycles สำรองไฟเมื่อไฟดับ'
    });
    bomItems.push({
      cat: '2. แบตเตอรี่สำรองพลังงาน',
      name: `ตู้ ATS & ตู้โหลดสำรอง Critical Backup Panel (ไฟแสงสว่าง, ตู้เย็น, Wi-Fi)`,
      qty: 1,
      unit: 'ตู้',
      note: 'สลับไฟอัตโนมัติภายใน 10-20 ms เมื่อไฟหลวงดับ'
    });
  }

  bomItems.push(
    {
      cat: '3. อุปกรณ์จับยึดหลังคา',
      name: `รางอะลูมิเนียมแอนอไดซ์ Solar Aluminum Rail (ขนาดมาตรฐาน 4.2 ม.)`,
      qty: standard42mRails,
      unit: 'เส้น',
      note: `รองรับ ${rows} แถว (รวมความยาวประมาณ ${railsTotalMeters} เมตร)`
    },
    {
      cat: '3. อุปกรณ์จับยึดหลังคา',
      name: `ชุดยึดหลังคา: ${roofFootType}`,
      qty: roofFeetCount,
      unit: 'ชุด',
      note: 'สแตนเลส 304 ทนทานต่อลมมรสุมและไอทะเลภาคใต้'
    },
    {
      cat: '3. อุปกรณ์จับยึดหลังคา',
      name: 'Mid Clamp (ตัวหนีบระหว่างแผงอะลูมิเนียม)',
      qty: midClamps,
      unit: 'ตัว',
      note: 'ขันด้วยประแจทอร์กตามแรงบิดมาตรฐาน 12-14 N·m'
    },
    {
      cat: '3. อุปกรณ์จับยึดหลังคา',
      name: 'End Clamp (ตัวหนีบปิดหัว-ท้ายแผงอะลูมิเนียม)',
      qty: endClamps,
      unit: 'ตัว',
      note: 'หนีบขอบแผง 30-35 มม. แข็งแรงแน่นหนา'
    },
    {
      cat: '3. อุปกรณ์จับยึดหลังคา',
      name: 'Earthing Clip / Grounding Lug (กิ๊บเชื่อมกราวด์โครงสร้าง)',
      qty: groundingClips + groundingLugs,
      unit: 'ชิ้น',
      note: 'เชื่อมรางและแผงเข้าเป็นระบบสายดินเดียวกันทั้งหมด'
    },
    {
      cat: '4. ระบบไฟกระแสตรง (DC)',
      name: 'ตู้ DC Combiner Box พร้อม DC Fuse 15A/20A 1000V และ DC Isolator Switch',
      qty: 1,
      unit: 'ตู้',
      note: 'IP65 กันน้ำกันฝุ่น ติดตั้งหน้าตู้ Inverter'
    },
    {
      cat: '4. ระบบไฟกระแสตรง (DC)',
      name: 'DC Surge Protection Device (SPD 1000V) ป้องกันฟ้าผ่า/แรงดันเกิน',
      qty: 1,
      unit: 'ตัว',
      note: 'มาตรฐาน IEC 61643-31 คลาส II'
    },
    {
      cat: '4. ระบบไฟกระแสตรง (DC)',
      name: 'สายไฟโซลาร์เซลล์ PV1-F / H1Z2Z2-K ขนาด 4 - 6 sq.mm. (สีแดง/ดำ)',
      qty: dcCable,
      unit: 'เมตร',
      note: `คำนวณตามอาคาร ${floors} ชั้น + ระยะเดินท่อเข้าตู้ Inverter`
    },
    {
      cat: '4. ระบบไฟกระแสตรง (DC)',
      name: 'หัวคอนเน็กเตอร์ MC4 สแตนดาร์ด 1000V กันน้ำ IP68',
      qty: mc4Pairs,
      unit: 'คู่',
      note: 'ใช้คีมย้ำ MC4 เฉพาะทาง ไม่ใช้คีมบีบทั่วไป'
    },
    {
      cat: '5. ท่อร้อยสายไฟ & ฟิตติ้ง',
      name: 'ท่อเหล็กร้อยสายไฟ EMT / IMC ขนาด 1/2" - 3/4" พร้อมข้อต่อและแคลมป์ยึดผนัง',
      qty: emtConduit,
      unit: 'เมตร',
      note: `แนวดิ่งตามตึก ${floors} ชั้น + แนวราบเข้าหาตู้ Inverter`
    },
    {
      cat: '5. ท่อร้อยสายไฟ & ฟิตติ้ง',
      name: 'กล่องพักสาย Junction Box / Pull Box อะลูมิเนียมกันน้ำ',
      qty: conduitBoxes,
      unit: 'กล่อง',
      note: 'ติดจุดเลี้ยวชายคาและจุดเข้าตู้ Combiner'
    },
    {
      cat: '6. ระบบไฟกระแสสลับ (AC)',
      name: 'ตู้ AC Distribution Panel (AC MCB/RCBO + AC SPD Class II)',
      qty: 1,
      unit: 'ตู้',
      note: 'ตัดวงจรอัตโนมัติเมื่อเกิดไฟฟ้าลัดวงจรหรือไฟดูด'
    },
    {
      cat: '6. ระบบไฟกระแสสลับ (AC)',
      name: 'สายไฟ AC แกนเดี่ยว/คู่ NYY หรือ CV ขนาดตามกำลัง Inverter',
      qty: acCable,
      unit: 'เมตร',
      note: 'เดินจาก Inverter ไปเข้าตู้เมนเบรกเกอร์ (MDB)'
    },
    {
      cat: '7. ระบบสายดิน (Grounding)',
      name: 'แท่งกราวด์ทองแดงบริสุทธิ์ (Copper Ground Rod) 5/8 นิ้ว ยาว 2.4 เมตร',
      qty: 1,
      unit: 'ชุด',
      note: 'ตอกลึกมิดดินพร้อมบ่อพักทดสอบกราวด์ (Ground Pit)'
    },
    {
      cat: '7. ระบบสายดิน (Grounding)',
      name: 'สายดินทองแดง THW สีเขียว-เหลือง ขนาด 6 - 10 sq.mm.',
      qty: groundCable,
      unit: 'เมตร',
      note: 'เชื่อมโครงสร้างหลังคา + Inverter ลงแท่งกราวด์ (< 5 โอห์ม)'
    }
  );

  tbody.innerHTML = '';
  bomItems.forEach((item, idx) => {
    const tr = document.createElement('tr');
    tr.className = idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 hover:bg-slate-50';
    tr.innerHTML = `
      <td class="py-2.5 px-4 font-mono font-bold text-slate-500">${idx + 1}</td>
      <td class="py-2.5 px-4 font-semibold text-brand-800 text-[11px]">${item.cat}</td>
      <td class="py-2.5 px-4 font-medium text-slate-900">${item.name}</td>
      <td class="py-2.5 px-4 text-center font-bold font-mono text-emerald-700 text-sm">${item.qty}</td>
      <td class="py-2.5 px-4 text-center text-slate-500 font-medium">${item.unit}</td>
      <td class="py-2.5 px-4 text-slate-500 text-[11px]">${item.note}</td>
    `;
    tbody.appendChild(tr);
  });
}

// -------------------------------------------------------------
// 4. Render Customer Quotation & Financial ROI Table
// -------------------------------------------------------------
function renderQuotationTable(panels, watt, kw, invCap, roofType, floors, orientation, systemType, batteryCap) {
  const tbody = document.getElementById('quotationTableBody');
  if (!tbody) return;

  // Orientation efficiency multiplier
  let orientMultiplier = 1.0;
  if (orientation === 'southwest') orientMultiplier = 0.95;
  else if (orientation === 'east') orientMultiplier = 0.88;
  else if (orientation === 'north') orientMultiplier = 0.75;

  // Energy & Financial Calculation
  const dailyKwh = (kw * 4.5 * 0.85 * orientMultiplier);
  const monthlyKwh = Math.round(dailyKwh * 30);
  const electricityRate = 4.70;
  const monthlySavings = Math.round(monthlyKwh * electricityRate);
  const annualSavings = Math.round(monthlySavings * 12);
  const co2Tons = ((monthlyKwh * 12 * 0.5) / 1000).toFixed(1);

  let panelUnitPrice = 4200;
  if (watt >= 650) panelUnitPrice = 4600;
  else if (watt >= 600) panelUnitPrice = 4400;

  const panelTotal = panels * panelUnitPrice;

  let invPrice = 36000;
  if (systemType === 'hybrid') {
    if (kw > 10) invPrice = 85000;
    else if (kw > 5) invPrice = 65000;
    else invPrice = 52000;
  } else {
    if (kw > 15) invPrice = 85000;
    else if (kw > 10) invPrice = 65000;
    else if (kw > 7) invPrice = 52000;
    else if (kw > 4.5) invPrice = 42000;
  }

  const rackTotal = Math.round(panels * 1100);
  const protectionTotal = 15500;
  const cableTotal = Math.round(14000 + (floors * 2500));
  const laborAndPermit = Math.round(24000 + (kw * 1800));

  const items = [
    {
      name: `แผงโซลาร์เซลล์ Tier 1 Monocrystalline N-Type ${watt}W (Half-Cell)`,
      qty: `${panels} แผง`,
      unitPrice: panelUnitPrice,
      total: panelTotal
    },
    {
      name: systemType === 'hybrid' ? `Hybrid Inverter ขนาด ${invCap} + Smart Meter Zero Export` : `On-Grid Inverter ขนาด ${invCap} + Smart Meter Zero Export`,
      qty: `1 ชุด`,
      unitPrice: invPrice,
      total: invPrice
    }
  ];

  if (systemType === 'hybrid') {
    const batteryUnitPrice = batteryCap === 5 ? 58000 : (batteryCap === 10 ? 105000 : 155000);
    items.push({
      name: `แบตเตอรี่ลิเธียม LiFePO4 ขนาด ${batteryCap} kWh + ตู้ ATS สำรองไฟฉุกเฉิน`,
      qty: `1 ชุด`,
      unitPrice: batteryUnitPrice,
      total: batteryUnitPrice
    });
  }

  items.push(
    {
      name: `โครงสร้างจับยึดรางอะลูมิเนียมแอนอไดซ์ + อุปกรณ์จับยึดสแตนเลส 304 ทรงหลังคาหน้างาน`,
      qty: `1 ระบบ`,
      unitPrice: rackTotal,
      total: rackTotal
    },
    {
      name: `ตู้ควบคุม DC/AC Combiner Box + DC/AC SPD กันฟ้าผ่า + Fuse 1000V + Isolator`,
      qty: `1 ชุด`,
      unitPrice: protectionTotal,
      total: protectionTotal
    },
    {
      name: `ท่อเหล็กร้อยสายไฟ EMT + สายไฟโซลาร์เซลล์ PV1-F + ระบบสายดิน Ground Rod 2.4 ม.`,
      qty: `1 งาน`,
      unitPrice: cableTotal,
      total: cableTotal
    },
    {
      name: `บริการติดตั้งมาตรฐานวิศวกรรม วสท. + ดำเนินการยื่นขอขนานไฟ กฟภ. ครบวงจร`,
      qty: `1 โครงการ`,
      unitPrice: laborAndPermit,
      total: laborAndPermit
    }
  );

  tbody.innerHTML = '';
  let subtotal = 0;

  items.forEach((item, idx) => {
    subtotal += item.total;
    const tr = document.createElement('tr');
    tr.className = idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60 hover:bg-slate-50';
    tr.innerHTML = `
      <td class="py-3 px-4 font-mono font-bold text-slate-500">${idx + 1}</td>
      <td class="py-3 px-4 font-medium text-slate-900">${item.name}</td>
      <td class="py-3 px-4 text-center font-semibold text-slate-700 font-mono">${item.qty}</td>
      <td class="py-3 px-4 text-right font-mono text-slate-600">฿${item.unitPrice.toLocaleString()}</td>
      <td class="py-3 px-4 text-right font-bold font-mono text-emerald-700">฿${item.total.toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });

  const vat = Math.round(subtotal * 0.07);
  const grandTotal = subtotal + vat;
  const paybackYears = annualSavings > 0 ? (grandTotal / annualSavings).toFixed(1) : 0;

  // Update Quotation Footers
  const quoteSubtotal = document.getElementById('quoteSubtotal');
  if (quoteSubtotal) quoteSubtotal.textContent = `฿${subtotal.toLocaleString()}`;
  const quoteVat = document.getElementById('quoteVat');
  if (quoteVat) quoteVat.textContent = `฿${vat.toLocaleString()}`;
  const quoteGrandTotal = document.getElementById('quoteGrandTotal');
  if (quoteGrandTotal) quoteGrandTotal.textContent = `฿${grandTotal.toLocaleString()}`;

  // Update ROI Cards
  const roiDailyUnits = document.getElementById('roiDailyUnits');
  if (roiDailyUnits) roiDailyUnits.innerHTML = `${dailyKwh.toFixed(1)} <span class="text-xs font-normal text-slate-500">kWh/วัน</span>`;
  const roiMonthlyUnits = document.getElementById('roiMonthlyUnits');
  if (roiMonthlyUnits) roiMonthlyUnits.textContent = `~${monthlyKwh.toLocaleString()} หน่วย/เดือน`;

  const roiMonthlySavings = document.getElementById('roiMonthlySavings');
  if (roiMonthlySavings) roiMonthlySavings.innerHTML = `฿${monthlySavings.toLocaleString()} <span class="text-xs font-normal text-slate-500">/เดือน</span>`;
  const roiAnnualSavings = document.getElementById('roiAnnualSavings');
  if (roiAnnualSavings) roiAnnualSavings.textContent = `~${annualSavings.toLocaleString()} บาท/ปี`;

  const roiPaybackYears = document.getElementById('roiPaybackYears');
  if (roiPaybackYears) roiPaybackYears.innerHTML = `${paybackYears} <span class="text-xs font-normal text-slate-500">ปี</span>`;

  const roiCo2 = document.getElementById('roiCo2');
  if (roiCo2) roiCo2.innerHTML = `${co2Tons} <span class="text-xs font-normal text-slate-500">ตัน/ปี</span>`;
}
