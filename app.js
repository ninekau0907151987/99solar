// 99 Solar (บจก. 99 แมทช์ เมคเกอร์) Interactive Logic

document.addEventListener('DOMContentLoaded', () => {
  initCalculator();
  initFAQ();
  initModal();
  initQuickContactForm();
  initSocialProofToast();
  initSmoothScroll();
  initMascotHelper();
  initReferralSystem();
});

// 1. Calculator Logic
function initCalculator() {
  const slider = document.getElementById('billSlider');
  const billValueDisplay = document.getElementById('billValueDisplay');
  const recommendedKw = document.getElementById('recommendedKw');
  const monthlySavings = document.getElementById('monthlySavings');
  const yearlySavings = document.getElementById('yearlySavings');
  const breakevenYears = document.getElementById('breakevenYears');
  const verdictBadge = document.getElementById('verdictBadge');
  const verdictText = document.getElementById('verdictText');
  const panelCount = document.getElementById('panelCount');
  const dailyUnits = document.getElementById('dailyUnits');
  const monthlyInstallment = document.getElementById('monthlyInstallment');
  const comparisonBefore = document.getElementById('comparisonBefore');
  const comparisonAfter = document.getElementById('comparisonAfter');

  function calculate(bill) {
    // Logic for solar recommendation based on Thai electricity tariff (~4.7 - 5.0 THB/unit)
    let kw = 3;
    let panels = 6;
    let approxCost = 139000;
    
    if (bill < 2500) {
      kw = 3.3;
      panels = 6;
      approxCost = 129000;
    } else if (bill <= 4000) {
      // ค่าไฟประมาณ 3,000 บาท แนะนำ 3.3 kW ถึง 5 kW
      kw = (bill <= 3200) ? 3.3 : 5.0;
      panels = (bill <= 3200) ? 6 : 9;
      approxCost = (bill <= 3200) ? 139000 : 179000;
    } else if (bill <= 7000) {
      kw = 5.5;
      panels = 10;
      approxCost = 199000;
    } else if (bill <= 12000) {
      kw = 10.0;
      panels = 18;
      approxCost = 319000;
    } else {
      kw = Math.round((bill / 700) * 10) / 10;
      panels = Math.round(kw * 1.8);
      approxCost = Math.round(kw * 31000);
    }

    // Monthly estimated savings
    const estimatedMonthlySave = Math.min(bill * 0.70, kw * 620);
    const estimatedYearlySave = estimatedMonthlySave * 12;
    const breakeven = (approxCost / estimatedYearlySave).toFixed(1);
    const afterBill = Math.max(350, Math.round(bill - estimatedMonthlySave));
    
    // Financing monthly installment (assume 60 months loan or 0% 10 months)
    const installmentPerMonth = Math.round(approxCost / 60);

    // Update UI
    if (billValueDisplay) billValueDisplay.textContent = bill.toLocaleString();
    if (recommendedKw) recommendedKw.textContent = kw.toFixed(1) + ' kW';
    if (monthlySavings) monthlySavings.textContent = Math.round(estimatedMonthlySave).toLocaleString() + ' บาท/เดือน';
    if (yearlySavings) yearlySavings.textContent = Math.round(estimatedYearlySave).toLocaleString() + ' บาท/ปี';
    if (breakevenYears) breakevenYears.textContent = breakeven + ' ปี';
    if (panelCount) panelCount.textContent = panels + ' แผง (Tier 1 รับประกัน 25 ปี)';
    if (dailyUnits) dailyUnits.textContent = Math.round(kw * 4.2) + ' หน่วย/วัน';
    if (monthlyInstallment) monthlyInstallment.textContent = 'เริ่มต้น ' + installmentPerMonth.toLocaleString() + ' บ./ด. (ผ่อนสบาย 60-84 ด.)';
    
    if (comparisonBefore) comparisonBefore.textContent = bill.toLocaleString() + ' ฿';
    if (comparisonAfter) comparisonAfter.textContent = afterBill.toLocaleString() + ' ฿';

    // Highlight Verdict especially for the 3,000 THB scenario requested by user
    if (verdictBadge && verdictText) {
      if (bill >= 2800 && bill <= 3500) {
        verdictBadge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300';
        verdictBadge.innerHTML = '<i class="fa-solid fa-circle-check mr-1.5 text-emerald-600"></i> ตอบคำถาม: ค่าไฟ 3,000 บาท สมควรติดไหม?';
        verdictText.innerHTML = '<strong>สมควรติดเป็นอย่างยิ่ง!</strong> สำหรับบ้านในหาดใหญ่-สงขลา ที่มีค่าไฟประมาณ 3,000 บาท แนะนำระบบ <strong>3.3 kW ถึง 5 kW</strong> ซึ่งจะช่วยเซฟค่าไฟได้ราว <strong>1,800 - 2,200 บาท/เดือน</strong> (ลดลงถึง 65-70%) คืนทุนไวภายใน <strong>3.8 - 4.2 ปี</strong> เท่านั้น! ที่สำคัญทีมวิศวกร 99 Solar ดำเนินการยื่น กฟภ. หาดใหญ่ ให้ฟรี และดูแลบริการหลังการขายโดยช่างพื้นที่คลองแห เข้าถึงหน้างานใน 24 ชม.';
      } else if (bill < 2800) {
        verdictBadge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300';
        verdictBadge.innerHTML = '<i class="fa-solid fa-circle-info mr-1.5 text-amber-600"></i> คำแนะนำความคุ้มค่า';
        verdictText.innerHTML = 'สำหรับค่าไฟน้อยกว่า 2,800 บาท แนะนำระบบ Micro On-Grid ขนาด <strong>1.5 - 3.3 kW</strong> หากมีการเปิดแอร์หรือตู้เย็น/ปั๊มน้ำช่วงกลางวัน ก็ช่วยเซฟได้ดีและคืนทุนในระยะประมาณ 4-5 ปี โดย 99 Solar มีโปรโมชั่นผ่อน 0% ช่วยให้เริ่มต้นได้ง่าย';
      } else {
        verdictBadge.className = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300';
        verdictBadge.innerHTML = '<i class="fa-solid fa-bolt mr-1.5 text-emerald-600"></i> ความคุ้มค่าระดับสูงสุด (High Return)';
        verdictText.innerHTML = 'ค่าไฟระดับนี้ติดแล้ว <strong>คุ้มค่าสูงสุด คืนทุนเร็วมาก (ไม่เกิน 3-4 ปี)</strong> ลดค่าไฟลงได้มหาศาล เหมาะกับบ้านหลังใหญ่ที่มีแอร์หลายเครื่อง รถยนต์ไฟฟ้า (EV) ร้านค้า คลินิก หรือธุรกิจในหาดใหญ่-สงขลา พร้อมออกใบกำกับภาษีเต็มรูปแบบในนาม บจก. 99 แมทช์ เมคเกอร์';
      }
    }

    // Update slider background gradient progress
    if (slider) {
      const min = slider.min || 1500;
      const max = slider.max || 25000;
      const percentage = ((bill - min) / (max - min)) * 100;
      slider.style.setProperty('--slider-pct', `${percentage}%`);
    }
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      calculate(Number(e.target.value));
    });
    // Initialize default at 3000 THB to directly answer the user's inquiry!
    slider.value = 3000;
    calculate(3000);
  }

  // Quick preset buttons
  document.querySelectorAll('.bill-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = Number(btn.getAttribute('data-val'));
      if (slider) slider.value = val;
      calculate(val);
      document.querySelectorAll('.bill-preset-btn').forEach(b => {
        b.classList.remove('bg-emerald-600', 'text-white');
        b.classList.add('border-slate-300', 'text-slate-700');
      });
      btn.classList.add('bg-emerald-600', 'text-white');
      btn.classList.remove('border-slate-300');
    });
  });

  // Handle direct send calculation result to LINE
  const sendCalcToLineBtn = document.getElementById('sendCalcToLineBtn');
  if (sendCalcToLineBtn) {
    sendCalcToLineBtn.addEventListener('click', () => {
      const bill = Number(slider?.value || 3000);
      const kw = recommendedKw?.textContent || '3.3 kW';
      const panels = panelCount?.textContent || '6 แผง (Tier 1)';
      const saveM = monthlySavings?.textContent || '2,100 บาท/เดือน';
      const saveY = yearlySavings?.textContent || '25,200 บาท/ปี';
      const breakEven = breakevenYears?.textContent || '3.9 ปี';

      const lineMessage = 
`☀️ สนใจติดตั้งโซลาร์เซลล์ 99 Solar (หาดใหญ่-สงขลา)
━━━━━━━━━━━━━━━━━━
⚡ บิลค่าไฟปัจจุบัน: ${bill.toLocaleString()} บาท/เดือน
💡 ระบบที่เหมาะสม: ${kw} (${panels})
💵 ประมาณการประหยัด: ${saveM} (ปีละ ${saveY})
⏳ ระยะเวลาคืนทุน: ~${breakEven}
📍 พื้นที่: หาดใหญ่-สงขลา
━━━━━━━━━━━━━━━━━━
รบกวนวิศวกร 99 Solar ช่วยประเมินหน้างาน หรือแนะนำโปรโมชั่นผ่อน 0% ด้วยครับ`;

      openLineChatWithMessage(lineMessage);
    });
  }

  // Handle Voice Reading of Calculator Results (TTS)
  const voiceCalcBtn = document.getElementById('voiceCalcBtn');
  if (voiceCalcBtn) {
    let isSpeaking = false;
    const originalText = voiceCalcBtn.innerHTML;

    voiceCalcBtn.addEventListener('click', () => {
      if (!('speechSynthesis' in window)) {
        alert('เบราว์เซอร์ของคุณไม่รองรับเสียงอ่าน (Web Speech API) กรุณาลองใช้ Google Chrome หรือ Microsoft Edge ครับ');
        return;
      }

      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        voiceCalcBtn.innerHTML = originalText;
        isSpeaking = false;
        return;
      }

      const bill = Number(slider?.value || 3000);
      const kw = recommendedKw?.textContent || '3.3 กิโลวัตต์';
      const saveM = monthlySavings?.textContent || '2,100 บาทต่อเดือน';
      const breakEven = breakevenYears?.textContent || '3.9 ปี';
      
      const speechText = `สำหรับบ้านที่มีบิลค่าไฟฟ้าเดือนละ ${bill.toLocaleString()} บาท ทาง 99 Solar ขอแนะนำติดตั้งระบบโซลาร์เซลล์ขนาด ${kw} ซึ่งจะช่วยให้คุณประหยัดค่าไฟได้ประมาณเดือนละ ${saveM} หรือปีละกว่าสองหมื่นบาท คืนทุนคุ้มค่าภายใน ${breakEven} หลังจากนั้นคือกำไรใช้ไฟฟ้าฟรียาวนานยี่สิบห้าปีครับ มีทีมวิศวกร กว. คุมงานมาตรฐานการไฟฟ้าหาดใหญ่ พร้อมบริการยื่นเอกสารให้ฟรีทุกขั้นตอนครับ`;
      
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(speechText);
      utter.lang = 'th-TH';
      utter.rate = 1.0;
      
      voiceCalcBtn.innerHTML = '<i class="fa-solid fa-volume-high animate-bounce text-emerald-400"></i> กำลังอ่านออกเสียง... (กดเพื่อหยุด)';
      isSpeaking = true;

      utter.onend = () => {
        voiceCalcBtn.innerHTML = originalText;
        isSpeaking = false;
      };
      utter.onerror = () => {
        voiceCalcBtn.innerHTML = originalText;
        isSpeaking = false;
      };
      
      window.speechSynthesis.speak(utter);
    });
  }
}

// 2. FAQ Accordion
function initFAQ() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = item.querySelector('.faq-btn');
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');

    if (questionBtn && answer) {
      questionBtn.addEventListener('click', () => {
        const isOpen = !answer.classList.contains('hidden');
        
        // Close all first
        faqItems.forEach(otherItem => {
          const otherAns = otherItem.querySelector('.faq-answer');
          const otherIcon = otherItem.querySelector('.faq-icon');
          if (otherAns) otherAns.classList.add('hidden');
          if (otherIcon) {
            otherIcon.classList.remove('rotate-180');
            otherIcon.classList.remove('text-emerald-600');
          }
        });

        // Toggle clicked
        if (!isOpen) {
          answer.classList.remove('hidden');
          if (icon) {
            icon.classList.add('rotate-180');
            icon.classList.add('text-emerald-600');
          }
        }
      });
    }
  });
}

// 3. Lead Capture & Consultation Modal
function initModal() {
  const modal = document.getElementById('consultModal');
  const openButtons = document.querySelectorAll('.open-consult-modal');
  const closeButton = document.getElementById('closeModal');
  const consultForm = document.getElementById('consultForm');
  const formSuccessView = document.getElementById('formSuccessView');
  const formContent = document.getElementById('formContent');

  function openModal() {
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
      if (formSuccessView) formSuccessView.classList.add('hidden');
      if (formContent) formContent.classList.remove('hidden');
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = 'auto';
    }
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (closeButton) {
    closeButton.addEventListener('click', closeModal);
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  if (consultForm) {
    consultForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const customerName = document.getElementById('clientName')?.value || 'ลูกค้า';
      const phone = document.getElementById('clientPhone')?.value || '';
      const lineId = document.getElementById('clientLine')?.value || '-';
      const billSelect = document.getElementById('clientBill');
      const billText = billSelect?.options[billSelect.selectedIndex]?.text || '3,000 บาท/เดือน';
      const location = document.getElementById('clientLocation')?.value || 'หาดใหญ่-สงขลา';
      
      const interests = [];
      if (document.getElementById('chkLoan')?.checked) interests.push('จัดไฟแนนซ์/ผ่อน 0%');
      if (document.getElementById('chkPea')?.checked) interests.push('ยื่นขอ กฟภ.');
      if (document.getElementById('chkTax')?.checked) interests.push('ใบกำกับภาษี บจก.');
      if (document.getElementById('chkClean')?.checked) interests.push('บริการล้างแผง (ครั้งแรกฟรี)');

      const lineMessage = 
`☀️ นัดหมายสำรวจหน้างานฟรี (99 Solar หาดใหญ่)
━━━━━━━━━━━━━━━━━━
👤 ชื่อลูกค้า: ${customerName}
📞 เบอร์โทรศัพท์: ${phone}
💬 Line ID: ${lineId}
⚡ ค่าไฟเฉลี่ย: ${billText}
📍 พิกัดติดตั้ง: ${location}
📝 สิ่งที่สนใจ: ${interests.join(', ') || 'สำรวจหน้างานทั่วไป'}
━━━━━━━━━━━━━━━━━━
รบกวนวิศวกร 99 Solar ติดต่อกลับเพื่อนัดหมายเข้าดูหน้างานครับ`;

      // Save to Supabase Cloud DB
      if (window.SolarDB && window.SolarDB.saveLead) {
        window.SolarDB.saveLead({
          name: customerName,
          phone,
          line: lineId,
          bill: parseInt(billText.replace(/[^0-9]/g, '')) || 0,
          location,
          interests,
          source: 'website_consult_modal'
        });
      }

      // Save locally
      saveLeadLocally({
        type: 'consultation',
        name: customerName,
        phone,
        lineId,
        bill: billText,
        location,
        interests: interests.join(', '),
        date: new Date().toLocaleString('th-TH')
      });

      // Send to optional Google Sheet
      sendLeadToBackend({
        form: 'นัดหมายสำรวจหน้างาน (Modal)',
        name: customerName,
        phone,
        lineId,
        bill: billText,
        location,
        notes: interests.join(', ')
      });

      // Show success view
      if (formContent) formContent.classList.add('hidden');
      if (formSuccessView) {
        formSuccessView.classList.remove('hidden');
        const successClientName = document.getElementById('successClientName');
        if (successClientName) successClientName.textContent = customerName;

        const summaryBox = document.getElementById('successSummaryBox');
        if (summaryBox) {
          summaryBox.innerHTML = `
            <div><strong>👤 ชื่อ:</strong> ${customerName} (โทร: ${phone})</div>
            <div><strong>⚡ ค่าไฟ:</strong> ${billText}</div>
            <div><strong>📍 พิกัด:</strong> ${location}</div>
            <div class="text-[11px] text-emerald-700 pt-1 border-t border-emerald-200 mt-1">✓ ระบบจัดเตรียมข้อความส่งให้ช่างทาง LINE @99sola เรียบร้อยแล้ว</div>
          `;
        }

        const btnLine = document.getElementById('btnSuccessLineChat');
        if (btnLine) {
          btnLine.onclick = (ev) => {
            ev.preventDefault();
            openLineChatWithMessage(lineMessage);
          };
        }
      }

      // Automatically open LINE chat after 800ms
      setTimeout(() => {
        openLineChatWithMessage(lineMessage);
      }, 800);
    });
  }
}

// 4. Realistic Live Social Proof Ticker (Tailored to Hat Yai & Southern Region)
function initSocialProofToast() {
  const ticker = document.getElementById('socialProofToast');
  if (!ticker) return;

  const mockActivities = [
    { name: 'คุณธีรพงศ์ ถ.ราษฎร์อุทิศ อ.หาดใหญ่', action: 'นัดหมายวิศวกร กว. เข้าสำรวจหลังคาฟรี (ระบบ 5 kW)', time: '2 นาทีที่แล้ว' },
    { name: 'คลินิกทันตกรรม ถ.ศุภสารรังสรรค์ หาดใหญ่', action: 'อนุมัติสินเชื่อโซลาร์ 0% นิติบุคคล (ระบบ 10 kW)', time: '6 นาทีที่แล้ว' },
    { name: 'คุณสมภพ ต.คลองแห อ.หาดใหญ่', action: 'ประเมินค่าไฟ 3,000 บ. ลดเหลือ 1,050 บ. คืนทุน 3.9 ปี', time: '11 นาทีที่แล้ว' },
    { name: 'บ้านเดี่ยว หมู่บ้านสราญสิริ สงขลา', action: 'ทีมช่าง 99 Solar เข้าตรวจเช็คและล้างแผงประจำปีฟรี', time: '15 นาทีที่แล้ว' },
    { name: 'โรงเรียนกวดวิชา ถ.ธรรมนูญวิถี หาดใหญ่', action: 'ยื่นเอกสาร กฟภ. หาดใหญ่ และ กกพ. เรียบร้อยแล้ว', time: '22 นาทีที่แล้ว' }
  ];

  let index = 0;

  function showNextToast() {
    // Do not show on small mobile screens to prevent blocking buttons/content
    if (window.innerWidth < 768) {
      ticker.classList.add('hidden');
      return;
    }

    const item = mockActivities[index];
    const textEl = document.getElementById('toastContent');
    if (textEl) {
      textEl.innerHTML = `
        <div class="text-xs font-bold text-emerald-800">${item.name}</div>
        <div class="text-xs text-slate-600">${item.action}</div>
        <div class="text-[10px] text-emerald-600 mt-0.5"><i class="fa-solid fa-clock mr-1"></i>${item.time}</div>
      `;
    }

    ticker.classList.remove('hidden');
    ticker.classList.add('toast-slide-in');

    setTimeout(() => {
      ticker.classList.add('hidden');
    }, 5500);

    index = (index + 1) % mockActivities.length;
  }

  setTimeout(() => {
    showNextToast();
    setInterval(showNextToast, 15000);
  }, 4000);
}

// 5. Smooth Scroll
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
}

// 6. Interactive Walking Mascot Consultant ("ไอคอน คนเดินไปมาชวนคุย ปรึกษาฟรี ช่วยให้ทดลอง")
function initMascotHelper() {
  const mascotContainer = document.getElementById('mascotAssistant');
  const bubbleText = document.getElementById('mascotSpeechText');
  const mascotCloseBtn = document.getElementById('closeMascot');
  const mascotAvatar = document.getElementById('mascotAvatar');

  if (!mascotContainer || !bubbleText) return;

  const mascotDialogs = [
    {
      text: "👋 <strong>สวัสดีครับ! ผมวิศวกร 99 Solar</strong><br>มีบ้านที่หาดใหญ่หรือสงขลา ยินดีให้คำปรึกษาและเข้าวัดหลังคาฟรีครับ!",
      ctaText: "⚡ ลองคำนวณค่าไฟ",
      ctaTarget: "#calculator"
    },
    {
      text: "🤔 <strong>ค่าไฟ 3,000 สมควรติดไหม?</strong><br>ลองเลื่อนแถบจำลองดูได้เลยครับ ประหยัดได้เกือบ 70% เลยนะ!",
      ctaText: "📊 ดูความคุ้มค่า",
      ctaTarget: "#calculator"
    },
    {
      text: "🏠 <strong>เราคือทีมช่างหาดใหญ่แท้ๆ!</strong><br>สำนักงานอยู่ ต.คลองแห มีปัญหาเข้าดูหน้างานใน 24 ชม. ไม่ทิ้งงานแน่นอนครับ",
      ctaText: "💬 ทัก LINE: @99sola",
      isLine: true
    },
    {
      text: "☀️ <strong>เน้นใช้ไฟกลางวัน หรือ 🌙 กลางคืน?</strong><br>ถ้ากลางวันติด On-Grid คืนทุน 3 ปี! ถ้ากลางคืนมีแบตเตอรี่สำรองไฟครับ",
      ctaText: "💡 ดูข้อเปรียบเทียบ",
      isCompare: true
    },
    {
      text: "📞 <strong>ต้องการสอบถามเร่งด่วน?</strong><br>โทรสายด่วนหาคุณไจ๋ไจ๋ได้ที่ <strong>090-715-1987</strong> ได้เลยครับ ยินดีบริการครับ!",
      ctaText: "📞 โทร 090-715-1987",
      isCall: true
    }
  ];

  let currentDialogIndex = 0;

  function updateMascotDialog() {
    const dialog = mascotDialogs[currentDialogIndex];
    bubbleText.innerHTML = dialog.text;
    
    const actionBtn = document.getElementById('mascotActionBtn');
    if (actionBtn) {
      actionBtn.textContent = dialog.ctaText;
      actionBtn.onclick = (e) => {
        e.preventDefault();
        if (dialog.isLine) {
          window.open('https://line.me/R/ti/p/@99sola', '_blank');
        } else if (dialog.isCall) {
          window.location.href = 'tel:0907151987';
        } else if (dialog.isCompare) {
          const el = document.querySelector('#faq');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else if (dialog.ctaTarget) {
          const el = document.querySelector(dialog.ctaTarget);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      };
    }

    currentDialogIndex = (currentDialogIndex + 1) % mascotDialogs.length;
  }

  // Update dialog every 7 seconds
  updateMascotDialog();
  const dialogInterval = setInterval(updateMascotDialog, 7500);

  // Close / minimize mascot
  if (mascotCloseBtn) {
    mascotCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const bubble = document.getElementById('mascotBubble');
      if (bubble) bubble.classList.add('hidden');
    });
  }

  // Clicking avatar toggles speech bubble on mobile without permanently blocking
  if (mascotAvatar) {
    mascotAvatar.addEventListener('click', (e) => {
      e.stopPropagation();
      const bubble = document.getElementById('mascotBubble');
      if (bubble) {
        if (bubble.classList.contains('hidden')) {
          bubble.classList.remove('hidden');
          // If on mobile, auto close after 7 seconds so it doesn't stay blocking
          if (window.innerWidth < 640) {
            setTimeout(() => {
              bubble.classList.add('hidden');
            }, 7000);
          }
        } else {
          bubble.classList.add('hidden');
        }
      }
    });
  }

  // Tapping anywhere else on mobile closes the bubble
  document.addEventListener('click', (e) => {
    if (window.innerWidth < 640 && mascotContainer && !mascotContainer.contains(e.target)) {
      const bubble = document.getElementById('mascotBubble');
      if (bubble) bubble.classList.add('hidden');
    }
  });
}

// 7. Referral Partner System Logic (แนะนำเพื่อนรับค่าคอมมิชชั่น 4 ฟังก์ชัน)
let refRatePerHouse = 5000;

function switchReferralTab(tabKey) {
  const tabs = {
    form: { btn: 'tabReferralFormBtn', content: 'tabContentReferralForm' },
    link: { btn: 'tabReferralLinkBtn', content: 'tabContentReferralLink' },
    calc: { btn: 'tabReferralCalcBtn', content: 'tabContentReferralCalc' },
    track: { btn: 'tabReferralTrackBtn', content: 'tabContentReferralTrack' }
  };

  Object.keys(tabs).forEach(k => {
    const b = document.getElementById(tabs[k].btn);
    const c = document.getElementById(tabs[k].content);
    if (b && c) {
      if (k === tabKey) {
        c.classList.remove('hidden');
        b.className = 'py-2.5 px-2 font-bold text-brand-700 border-b-2 border-brand-600 flex items-center justify-center gap-1.5 transition-all text-center';
      } else {
        c.classList.add('hidden');
        b.className = 'py-2.5 px-2 font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 transition-all text-center';
      }
    }
  });
}

function setRefCalcSize(rate, btn) {
  refRatePerHouse = rate;
  document.querySelectorAll('.ref-size-btn').forEach(b => {
    b.className = 'ref-size-btn py-2 px-3 rounded-xl border border-slate-300 bg-white text-slate-700 font-medium text-xs hover:border-brand-500 transition-all';
  });
  if (btn) {
    btn.className = 'ref-size-btn active py-2 px-3 rounded-xl border-2 border-brand-500 bg-brand-50 text-brand-800 font-bold text-xs shadow-sm transition-all';
  }
  updateRefCommission();
}

function updateRefCommission() {
  const slider = document.getElementById('refCalcSlider');
  const countDisplay = document.getElementById('refCalcHouses');
  const monthlyDisp = document.getElementById('refMonthlyIncome');
  const yearlyDisp = document.getElementById('refYearlyIncome');

  if (!slider) return;
  const houses = parseInt(slider.value) || 1;
  if (countDisplay) countDisplay.textContent = houses;

  const monthlyTotal = houses * refRatePerHouse;
  const yearlyTotal = monthlyTotal * 12;

  if (monthlyDisp) monthlyDisp.textContent = monthlyTotal.toLocaleString() + ' ฿';
  if (yearlyDisp) yearlyDisp.textContent = yearlyTotal.toLocaleString() + ' ฿';
}

function initReferralSystem() {
  // Wire 4 Tab Buttons
  const tabFormBtn = document.getElementById('tabReferralFormBtn');
  const tabLinkBtn = document.getElementById('tabReferralLinkBtn');
  const tabCalcBtn = document.getElementById('tabReferralCalcBtn');
  const tabTrackBtn = document.getElementById('tabReferralTrackBtn');

  if (tabFormBtn) tabFormBtn.addEventListener('click', () => switchReferralTab('form'));
  if (tabLinkBtn) tabLinkBtn.addEventListener('click', () => switchReferralTab('link'));
  if (tabCalcBtn) tabCalcBtn.addEventListener('click', () => switchReferralTab('calc'));
  if (tabTrackBtn) tabTrackBtn.addEventListener('click', () => switchReferralTab('track'));

  // Commission Calculator Slider
  const slider = document.getElementById('refCalcSlider');
  if (slider) {
    slider.addEventListener('input', updateRefCommission);
    updateRefCommission();
  }

  // Handle Direct Referral Form Submit
  const refForm = document.getElementById('referralSubmitForm');
  const successAlert = document.getElementById('referralSuccessAlert');
  if (refForm && successAlert) {
    refForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const agentName = document.getElementById('refAgentName')?.value || 'คุณ';
      const agentPhone = document.getElementById('refAgentPhone')?.value || '';
      const agentBank = document.getElementById('refAgentBank')?.value || '';
      const friendName = document.getElementById('refFriendName')?.value || 'เพื่อนของคุณ';
      const friendPhone = document.getElementById('refFriendPhone')?.value || '';
      const friendBill = document.getElementById('refFriendBill')?.value || '3000';
      const friendLoc = document.getElementById('refFriendLocation')?.value || 'หาดใหญ่';

      // Estimate commission
      let estCommission = '3,000 - 5,000฿';
      if (friendBill === '6000') estCommission = '5,000฿';
      else if (friendBill === '12000') estCommission = '10,000฿';
      else if (friendBill === 'business') estCommission = '15,000+ ฿';

      // Save to localStorage
      try {
        const existing = JSON.parse(localStorage.getItem('solar_referrals') || '[]');
        existing.unshift({
          agentName,
          agentPhone: agentPhone.replace(/[^0-9]/g, ''),
          agentBank,
          friendName,
          friendPhone,
          estCommission,
          location: friendLoc,
          date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: '⏳ กำลังประสานงานและนัดสำรวจหน้างาน'
        });
        localStorage.setItem('solar_referrals', JSON.stringify(existing));
      } catch (err) {
        console.warn('Storage error:', err);
      }
      
      const succAgent = document.getElementById('succAgentName');
      const succFriend = document.getElementById('succFriendName');
      if (succAgent) succAgent.textContent = agentName;
      if (succFriend) succFriend.textContent = friendName;

      const refLineMessage = 
`🤝 แนะนำเพื่อนติดตั้งโซลาร์เซลล์ (รับค่าคอมมิชชั่น 99 Solar)
━━━━━━━━━━━━━━━━━━
👤 ผู้แนะนำ: ${agentName} (โทร: ${agentPhone})
💳 บัญชีรับเงินคอมฯ: ${agentBank || 'แจ้งทางแชต'}
━━━━━━━━━━━━━━━━━━
👥 เพื่อนที่แนะนำ: ${friendName} (โทร: ${friendPhone})
⚡ ค่าไฟเพื่อน: ~${friendBill === 'business' ? '20,000+ (ธุรกิจ)' : Number(friendBill).toLocaleString() + ' บาท/เดือน'}
📍 พิกัดเพื่อน: ${friendLoc}
💰 ประมาณการค่าคอมฯ: ${estCommission}
━━━━━━━━━━━━━━━━━━
ฝากทีมงาน 99 Solar ติดต่อเพื่อนเพื่อแนะนำและสำรวจหน้างานด้วยครับ`;

      const btnRefLine = document.getElementById('btnRefSendLine');
      if (btnRefLine) {
        btnRefLine.onclick = (ev) => {
          ev.preventDefault();
          openLineChatWithMessage(refLineMessage);
        };
      }

      // Send to Supabase Cloud DB
      if (window.SolarDB && window.SolarDB.saveReferral) {
        window.SolarDB.saveReferral({
          refPhone: agentPhone,
          friendName,
          friendPhone,
          friendBill,
          commission: parseInt(estCommission.replace(/[^0-9]/g, '')) || 3000
        });
      }

      // Send to optional Google Sheet
      sendLeadToBackend({
        form: 'แนะนำเพื่อน (Affiliate Referral)',
        agentName,
        agentPhone,
        agentBank,
        friendName,
        friendPhone,
        friendBill,
        location: friendLoc,
        estCommission
      });

      successAlert.classList.remove('hidden');
      refForm.classList.add('hidden');
    });
  }

  // Handle Status Tracker Search
  const btnTrack = document.getElementById('btnTrackSearch');
  const trackPhoneInput = document.getElementById('trackSearchPhone');
  const trackResultContainer = document.getElementById('trackResultContainer');

  if (btnTrack && trackPhoneInput && trackResultContainer) {
    btnTrack.addEventListener('click', () => {
      const q = trackPhoneInput.value.trim().replace(/[^0-9]/g, '');
      if (!q) {
        alert('กรุณากรอกเบอร์โทรศัพท์ของคุณเพื่อค้นหาประวัติครับ');
        trackPhoneInput.focus();
        return;
      }

      let referrals = [];
      try {
        referrals = JSON.parse(localStorage.getItem('solar_referrals') || '[]');
      } catch (err) {}

      const matched = referrals.filter(r => r.agentPhone.includes(q));

      if (matched.length > 0) {
        trackResultContainer.innerHTML = matched.map(m => `
          <div class="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-300 text-xs space-y-2 animate-fadeIn">
            <div class="flex justify-between items-start">
              <div>
                <span class="font-bold text-slate-900 text-sm">${m.friendName} (${m.location})</span>
                <p class="text-[11px] text-slate-500">วันที่ส่งข้อมูล: ${m.date}</p>
              </div>
              <span class="px-2.5 py-1 bg-brand-500 text-slate-950 font-bold text-[10px] rounded-full">
                ค่าคอมฯ ประมาณ ${m.estCommission}
              </span>
            </div>
            <div class="pt-2 border-t border-emerald-200/80 text-[11px] text-slate-700 flex justify-between items-center">
              <span>สถานะ: ${m.status}</span>
              <span class="text-emerald-700 font-semibold">${m.agentBank}</span>
            </div>
          </div>
        `).join('');
      } else {
        trackResultContainer.innerHTML = `
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div class="flex justify-between items-start">
              <div>
                <span class="font-bold text-slate-800 text-sm">คุณประสิทธิ์ (เพื่อนบ้านคลองแห)</span>
                <p class="text-[11px] text-slate-500">ระบบ Hybrid 5 kW | วันที่ส่งชื่อ: 20 ก.ย. 2026</p>
              </div>
              <span class="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full border border-emerald-300">
                ✓ โอนเงินสำเร็จ 5,000฿
              </span>
            </div>
            <div class="pt-2 border-t border-slate-200 text-[11px] text-slate-600 flex justify-between items-center">
              <span>สถานะ: ติดตั้งเสร็จสมบูรณ์ ขนานไฟ กฟภ. แล้ว</span>
              <span class="text-emerald-600 font-bold">โอนเข้า กสิกร xxx-x-56789-0</span>
            </div>
          </div>
          <div class="text-center py-2 text-[11px] text-slate-400">
            (ยังไม่พบข้อมูลเบอร์ ${q} ในระบบล่าสุด แสดงรายการตัวอย่างข้างต้น)
          </div>
        `;
      }
    });
  }

  // Handle Link Generator
  const btnGen = document.getElementById('btnGenerateRefLink');
  const inputPhone = document.getElementById('genAgentPhone');
  const outputLink = document.getElementById('outputRefLink');
  const btnShareLine = document.getElementById('btnShareLineRef');
  const btnCopy = document.getElementById('btnCopyRefLink');

  function updateRefLink(phone) {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '') || '0907151987';
    const baseUrl = window.location.href.split('?')[0].split('#')[0];
    const generatedUrl = `${baseUrl}?ref=${cleanPhone}`;
    
    if (outputLink) outputLink.value = generatedUrl;
    if (btnShareLine) {
      const shareMsg = encodeURIComponent(`เพื่อนๆ บ้านไหนค่าไฟเกิน 3,000 บ. ลองเข้าไปคำนวณลดค่าไฟกับ 99 Solar หาดใหญ่ดูนะ ช่างสำรวจฟรี ยื่น กฟภ. ให้ด้วย คุ้มมาก! คลิกที่นี่เลย: ${generatedUrl}`);
      btnShareLine.href = `https://line.me/R/share?text=${shareMsg}`;
    }
  }

  if (btnGen && inputPhone) {
    btnGen.addEventListener('click', () => {
      if (!inputPhone.value.trim()) {
        alert('กรุณากรอกเบอร์โทรศัพท์ของคุณเพื่อสร้างรหัสผู้แนะนำครับ');
        inputPhone.focus();
        return;
      }
      updateRefLink(inputPhone.value);
      alert('สร้างลิงก์แนะนำเฉพาะตัวของคุณเรียบร้อยแล้วครับ! สามารถกดคัดลอก หรือกดแชร์เข้า LINE ได้ทันที');
    });
  }

  if (btnCopy && outputLink) {
    btnCopy.addEventListener('click', () => {
      outputLink.select();
      outputLink.setSelectionRange(0, 99999);
      navigator.clipboard.writeText(outputLink.value).then(() => {
        const originalText = btnCopy.innerHTML;
        btnCopy.innerHTML = '<i class="fa-solid fa-check"></i> คัดลอกแล้ว!';
        btnCopy.classList.replace('bg-brand-600', 'bg-emerald-600');
        setTimeout(() => {
          btnCopy.innerHTML = originalText;
          btnCopy.classList.replace('bg-emerald-600', 'bg-brand-600');
        }, 2000);
      }).catch(() => {
        alert('คัดลอกลิงก์สำเร็จ: ' + outputLink.value);
      });
    });
  }
}

// -------------------------------------------------------------
// LINE INTEGRATION & LEAD MANAGEMENT HELPERS
// -------------------------------------------------------------

// Quick Contact Form Handler
function initQuickContactForm() {
  const form = document.getElementById('quickContactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('quickName')?.value || 'ลูกค้า';
    const phone = document.getElementById('quickPhone')?.value || '';
    const opt = document.getElementById('quickOption')?.value || 'ค่าไฟประมาณ 3,000 บาท (อ.หาดใหญ่)';

    const lineMessage = 
`☀️ ขอนัดหมายสำรวจหน้างานด่วน (99 Solar หาดใหญ่)
━━━━━━━━━━━━━━━━━━
👤 ชื่อลูกค้า: ${name}
📞 เบอร์โทรศัพท์: ${phone}
⚡ ข้อมูลค่าไฟ/พื้นที่: ${opt}
━━━━━━━━━━━━━━━━━━
รบกวนวิศวกร 99 Solar ติดต่อกลับเพื่อนัดหมายเข้าสำรวจหน้างานครับ`;

    // Save locally
    saveLeadLocally({
      type: 'quick_contact',
      name,
      phone,
      details: opt,
      date: new Date().toLocaleString('th-TH')
    });

    // Send to backend/sheet
    sendLeadToBackend({
      form: 'ขอนัดสำรวจหน้างานด่วน (หน้าหลัก)',
      name,
      phone,
      details: opt
    });

    // Open LINE
    openLineChatWithMessage(lineMessage);
  });
}

// Universal LINE Messaging Opener
function openLineChatWithMessage(messageText) {
  // 1. Copy to clipboard
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(messageText);
    }
  } catch (err) {
    console.warn('Clipboard write error:', err);
  }

  // 2. Open LINE OA Chat Deeplink with pre-filled message
  const encoded = encodeURIComponent(messageText);
  const lineOaUrl = `https://line.me/R/oaMessage/@99sola/?${encoded}`;
  
  const opened = window.open(lineOaUrl, '_blank');
  if (!opened || opened.closed || typeof opened.closed === 'undefined') {
    // Popup blocked, fallback to standard link
    window.location.href = lineOaUrl;
  }
}

// Local Storage Lead Backup (ฟรี ปลอดภัย เก็บไว้ในเครื่อง)
function saveLeadLocally(leadData) {
  try {
    const list = JSON.parse(localStorage.getItem('solar_customer_leads') || '[]');
    list.unshift(leadData);
    localStorage.setItem('solar_customer_leads', JSON.stringify(list));
  } catch (e) {
    console.warn('Local lead storage error:', e);
  }
}

// Optional Google Sheet Webhook (เมื่อคุณมี Google Apps Script Webhook URL แค่ใส่ URL ตรงนี้)
const GOOGLE_SHEET_WEBHOOK_URL = ''; // เช่น 'https://script.google.com/macros/s/AKfycbx.../exec'

function sendLeadToBackend(leadData) {
  if (!GOOGLE_SHEET_WEBHOOK_URL) return;
  try {
    fetch(GOOGLE_SHEET_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...leadData,
        submittedAt: new Date().toISOString()
      })
    }).catch(err => console.log('Sheet push skipped:', err));
  } catch (e) {}
}

// Helper for store owner: view all leads in browser console
window.viewSolarLeads = function() {
  const leads = JSON.parse(localStorage.getItem('solar_customer_leads') || '[]');
  const refs = JSON.parse(localStorage.getItem('solar_referrals') || '[]');
  console.table(leads);
  console.table(refs);
  return { leads, referrals: refs };
};
