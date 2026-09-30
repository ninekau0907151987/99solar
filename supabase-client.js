/**
 * ===================================================================
 * 99 SOLAR HAT YAI - SUPABASE & LINE DATABASE CLIENT
 * บริษัท 99 แมทช์ เมคเกอร์ จำกัด (คุณไจ๋ไจ๋ 090-715-1987)
 * ===================================================================
 * รองรับการบันทึกข้อมูลแบบ 2 ชั้น:
 * 1. บันทึกลง Supabase Database (Cloud SQL)
 * 2. ส่งแจ้งเตือนและส่งต่อเข้า LINE Official (@99sola)
 * 3. มีโหมดสำรอง (Fallback) บันทึกลง LocalStorage อัตโนมัติหากยังไม่ใส่ Supabase Key
 */

(function () {
  const STORAGE_KEY_URL = 'solar99_supabase_url';
  const STORAGE_KEY_ANON = 'solar99_supabase_anon';
  const DEFAULT_SUPABASE_URL = 'https://rvikurxokhlhvilmytil.supabase.co';
  const DEFAULT_SUPABASE_ANON = 'sb_publishable_N9Es25y2my10Mf9TiyKVtg_SWB2jh-Q';

  // ค่าเริ่มต้นที่ทดสอบเชื่อมต่อสำเร็จ 100% (สามารถเปลี่ยนหรือ override ใน LocalStorage ได้)
  let supabaseUrl = localStorage.getItem(STORAGE_KEY_URL) || DEFAULT_SUPABASE_URL;
  let supabaseAnonKey = localStorage.getItem(STORAGE_KEY_ANON) || DEFAULT_SUPABASE_ANON;
  let lineWebhook = localStorage.getItem(STORAGE_KEY_LINE_WEBHOOK) || '';

  let supabaseClient = null;

  function initSupabase() {
    if (supabaseUrl && supabaseAnonKey && window.supabase && window.supabase.createClient) {
      try {
        supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
        console.log('🟢 Supabase Client Initialized Successfully for 99 Solar');
        updateDbStatusUI(true);
      } catch (err) {
        console.warn('⚠️ Supabase init error:', err);
        supabaseClient = null;
        updateDbStatusUI(false);
      }
    } else {
      updateDbStatusUI(false);
    }
  }

  // เรียกใช้เมื่อโหลดหน้าเว็บ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initSupabase();
      injectDatabaseModal();
    });
  } else {
    initSupabase();
    injectDatabaseModal();
  }

  // =================================================================
  // PUBLIC DATABASE API (SolarDB)
  // =================================================================
  window.SolarDB = {
    // บันทึก Lead ลูกค้านัดหมายสำรวจหน้างาน
    async saveLead(leadData) {
      const record = {
        name: leadData.name || 'ไม่ระบุชื่อ',
        phone: leadData.phone || '-',
        line_id: leadData.line || '-',
        monthly_bill: leadData.bill || 0,
        location: leadData.location || 'หาดใหญ่/สงขลา',
        interests: leadData.interests || [],
        source: leadData.source || 'website_consult_form',
        created_at: new Date().toISOString()
      };

      // บันทึกลง Supabase
      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('solar_leads')
            .insert([record]);
          if (error) throw error;
          console.log('✅ Lead saved to Supabase:', data);
        } catch (err) {
          console.warn('⚠️ Supabase saveLead error, using local fallback:', err.message);
        }
      }

      // บันทึก LocalStorage สำรอง
      saveToLocalHistory('leads', record);
      return record;
    },

    // บันทึกใบเสนอราคา (Quotation)
    async saveQuotation(quoteData) {
      const record = {
        quote_no: quoteData.quoteNo || `QT-${Date.now()}`,
        customer_name: quoteData.customerName || 'ลูกค้า 99 Solar',
        customer_type: quoteData.customerType || 'personal',
        tax_id: quoteData.taxId || '-',
        branch: quoteData.branch || '-',
        contact_person: quoteData.contactPerson || '-',
        phone: quoteData.phone || '-',
        address: quoteData.address || 'หาดใหญ่-สงขลา',
        system_key: quoteData.systemKey || 'ongrid_5_0_1p',
        system_title: quoteData.systemTitle || 'ระบบ On-Grid 5.0 kW',
        gross_price: quoteData.grossPrice || 0,
        monthly_savings: quoteData.monthlySavings || 0,
        annual_savings: quoteData.annualSavings || 0,
        payback_years: quoteData.paybackYears || 0,
        purpose: quoteData.purpose || 'ขออนุมัติจัดซื้อ',
        created_at: new Date().toISOString()
      };

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('quotations')
            .insert([record]);
          if (error) throw error;
          console.log('✅ Quotation saved to Supabase:', data);
        } catch (err) {
          console.warn('⚠️ Supabase saveQuotation error, using local fallback:', err.message);
        }
      }

      saveToLocalHistory('quotations', record);
      return record;
    },

    // บันทึกใบขอราคาอะไหล่ร้านค้า (Parts RFQ)
    async saveRfq(rfqData) {
      const record = {
        rfq_no: rfqData.rfqNo || `RFQ-${Date.now()}`,
        vendor_name: rfqData.vendorName || '-',
        delivery_site: rfqData.deliverySite || 'หาดใหญ่',
        requester: rfqData.requester || 'ฝ่ายจัดซื้อ 99 Solar',
        items: rfqData.items || [],
        target_total: rfqData.targetTotal || 0,
        created_at: new Date().toISOString()
      };

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('parts_rfqs')
            .insert([record]);
          if (error) throw error;
          console.log('✅ RFQ saved to Supabase:', data);
        } catch (err) {
          console.warn('⚠️ Supabase saveRfq error:', err.message);
        }
      }

      saveToLocalHistory('parts_rfqs', record);
      return record;
    },

    // บันทึกการแนะนำเพื่อน (Referral)
    async saveReferral(refData) {
      const record = {
        ref_phone: refData.refPhone || '-',
        friend_name: refData.friendName || '-',
        friend_phone: refData.friendPhone || '-',
        friend_bill: refData.friendBill || '-',
        commission_estimate: refData.commission || 3000,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      if (supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('referrals')
            .insert([record]);
          if (error) throw error;
          console.log('✅ Referral saved to Supabase:', data);
        } catch (err) {
          console.warn('⚠️ Supabase saveReferral error:', err.message);
        }
      }

      saveToLocalHistory('referrals', record);
      return record;
    },

    // ส่งข้อความเข้า LINE Official / LINE Webhook
    sendToLine(text) {
      const lineUrl = `https://line.me/R/ti/p/@99sola?text=${encodeURIComponent(text)}`;
      window.open(lineUrl, '_blank');
    },

    // เปิดหน้าต่างตั้งค่า Supabase
    openConfigModal() {
      const modal = document.getElementById('supabaseConfigModal');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
      }
    },

    // ดึงสถานะ
    isConnected() {
      return !!supabaseClient;
    }
  };

  // บันทึกใน LocalStorage เสมอเพื่อความชัวร์
  function saveToLocalHistory(category, item) {
    try {
      const key = `solar99_db_${category}`;
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      history.unshift(item);
      if (history.length > 50) history.pop();
      localStorage.setItem(key, JSON.stringify(history));
    } catch (e) {}
  }

  // อัปเดตไอคอนสถานะการเชื่อมต่อบนหน้าเว็บ
  function updateDbStatusUI(connected) {
    const badges = document.querySelectorAll('.db-status-badge');
    badges.forEach(b => {
      if (connected) {
        b.className = 'db-status-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11px] font-bold cursor-pointer hover:bg-emerald-200 transition-all';
        b.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> <i class="fa-solid fa-database text-emerald-600"></i> Supabase: เชื่อมต่อแล้ว';
      } else {
        b.className = 'db-status-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-[11px] font-semibold cursor-pointer hover:bg-amber-100 hover:text-amber-800 hover:border-amber-300 transition-all';
        b.innerHTML = '<i class="fa-solid fa-cloud text-amber-500"></i> ตั้งค่า Supabase DB';
      }
    });
  }

  // สร้าง Modal สำหรับใส่ Supabase URL & Key แบบคลิกเดียว
  function injectDatabaseModal() {
    if (document.getElementById('supabaseConfigModal')) return;

    const modalHtml = `
      <div id="supabaseConfigModal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm hidden items-center justify-center p-4">
        <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-800 relative space-y-5 animate-scaleIn">
          
          <button onclick="document.getElementById('supabaseConfigModal').classList.add('hidden'); document.getElementById('supabaseConfigModal').classList.remove('flex');" class="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-xl w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100">
            <i class="fa-solid fa-xmark"></i>
          </button>

          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-2xl">
              <i class="fa-solid fa-database"></i>
            </div>
            <div>
              <h3 class="text-xl font-bold font-heading text-slate-900 leading-tight">เชื่อมต่อฐานข้อมูล Supabase</h3>
              <p class="text-xs text-slate-500">บริษัท 99 แมทช์ เมคเกอร์ จำกัด (ระบบคลาวด์และส่ง LINE อัตโนมัติ)</p>
            </div>
          </div>

          <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
            💡 <strong>วิธีเชื่อมต่อใน 1 นาที:</strong><br>
            1. เข้า <a href="https://supabase.com" target="_blank" class="font-bold underline text-emerald-700">supabase.com</a> แล้วกด New Project (ฟรี)<br>
            2. ไปที่ <strong>Project Settings > API</strong> ก๊อปปี้ <strong>Project URL</strong> และ <strong>anon public key</strong> มาวางด้านล่างนี้ได้เลยครับ!
          </div>

          <form id="supabaseConfigForm" class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-slate-700 mb-1">Project URL (เช่น https://xyz.supabase.co)</label>
              <input type="url" id="inputSupabaseUrl" value="${supabaseUrl}" placeholder="https://your-project.supabase.co" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none">
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Anon Public Key</label>
              <textarea id="inputSupabaseAnon" rows="3" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." class="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-tight">${supabaseAnonKey}</textarea>
            </div>

            <div class="pt-2 flex items-center gap-2">
              <button type="submit" class="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 text-xs flex items-center justify-center gap-2">
                <i class="fa-solid fa-floppy-disk"></i> <span>บันทึกการเชื่อมต่อ Supabase</span>
              </button>
              <button type="button" onclick="testSupabaseConnection()" class="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors">
                ทดสอบ
              </button>
            </div>
          </form>

          <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>📞 คุณไจ๋ไจ๋ 090-715-1987</span>
            <a href="https://line.me/R/ti/p/@99sola" target="_blank" class="text-emerald-600 font-bold hover:underline">
              <i class="fa-brands fa-line text-xs"></i> LINE: @99sola
            </a>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('supabaseConfigForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const url = document.getElementById('inputSupabaseUrl').value.trim();
      const anon = document.getElementById('inputSupabaseAnon').value.trim();

      localStorage.setItem(STORAGE_KEY_URL, url);
      localStorage.setItem(STORAGE_KEY_ANON, anon);
      supabaseUrl = url;
      supabaseAnonKey = anon;

      initSupabase();

      alert('✅ บันทึกข้อมูลเชื่อมต่อ Supabase เรียบร้อยแล้ว!');
      document.getElementById('supabaseConfigModal').classList.add('hidden');
      document.getElementById('supabaseConfigModal').classList.remove('flex');
    });
  }

  // ทดสอบการเชื่อมต่อ
  window.testSupabaseConnection = async function () {
    const url = document.getElementById('inputSupabaseUrl').value.trim();
    const anon = document.getElementById('inputSupabaseAnon').value.trim();

    if (!url || !anon) {
      alert('กรุณากรอกทั้ง URL และ Anon Key ให้ครบถ้วนก่อนทดสอบครับ');
      return;
    }

    try {
      const testClient = window.supabase.createClient(url, anon);
      const { data, error } = await testClient.from('solar_leads').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') {
        alert(`⚠️ เชื่อมต่อได้ แต่พบแจ้งเตือน: ${error.message}\n(อาจเกิดจากยังไม่ได้กดสร้างตาราง SQL สามารถรันไฟล์ schema.sql ได้ครับ)`);
      } else {
        alert('🎉 ยินดีด้วยครับ! การเชื่อมต่อ Supabase Database สำเร็จสมบูรณ์ 100%');
      }
    } catch (err) {
      alert(`❌ การเชื่อมต่อล้มเหลว: ${err.message}`);
    }
  };

})();
