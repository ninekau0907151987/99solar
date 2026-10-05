/**
 * 99 Solar Hat Yai - Advanced 3-Tier LINE Messaging API Webhook
 * โฮสต์บน Vercel Serverless: https://99solar99.vercel.app/api/line-webhook
 * 
 * ระบบ 3 ลำดับขั้น (3-Tier Bot Engine) + Human Hand-off (เปิด/ปิดแชทอัตโนมัติ):
 * 1. Tier 1: Auto-Reply ตอบคำถามทั่วไป (ราคา, คำนวณ, สัญญา, สเปก) ทันที
 * 2. Tier 2: Auto-Reply + Alert แจ้งเตือนคุณไจ๋ไจ๋ทันที (ลูกค้านัดหมาย, ทิ้งเบอร์, ขอใบเสนอราคา)
 * 3. Tier 3: Human Takeover เมื่ออยู่นอกเหนือความเข้าใจ บอทส่งข้อความพักสาย สั่ง "ปิดบอทชั่วคราว"
 *             และยิง Alert แจ้งเตือนด่วนให้คุณไจ๋ไจ๋เข้ามาตอบสดทันที โดยที่บอทไม่กวน
 * 4. Rich Menu Switcher: รองรับการสลับหน้าริชเมนูผ่าน Postback
 */

const https = require('https');

// ค่า Environment Variables ดึงจาก Vercel
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
const JAIJAI_LINE_USER_ID = process.env.JAIJAI_LINE_USER_ID || ''; // LINE User ID ของคุณไจ๋ไจ๋เพื่อรับแจ้งเตือน
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rvikurxokhlhvilmytil.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2aWt1cnhva2hsaHZpbG15dGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTM0NTUsImV4cCI6MjA3NDg2OTQ1NX0.2XQzE2fPz9YVjL49L47rE57C3eD8U2a3H8gqQ_yZ-2I';

// แคชหน่วยความจำสำหรับจำสถานะเปิด/ปิดบอทรายลูกค้า (Human Hand-off)
// Map<userId, { isPaused: boolean, pausedAt: number }>
const humanTakeoverMap = new Map();
const TAKEOVER_TIMEOUT_MS = 12 * 60 * 60 * 1000; // ปิดบอท 12 ชั่วโมงแล้วรีเซ็ตกลับเป็นปกติ

module.exports = async (req, res) => {
  // เช็กสถานะ Webhook (GET)
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: '99 Solar Hat Yai - 3-Tier LINE Bot Engine',
      company: '99 Match Maker Co., Ltd.',
      active_takeovers: humanTakeoverMap.size,
      time: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const events = req.body?.events || [];

  // เมื่อกดปุ่ม Verify ใน LINE Developers Console
  if (events.length === 0) {
    return res.status(200).send('OK (Verified)');
  }

  try {
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        await handleTextMessage(event);
      } else if (event.type === 'postback') {
        await handlePostback(event);
      } else if (event.type === 'follow') {
        await handleFollow(event);
      }
    }
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling LINE webhook event:', error);
    return res.status(500).send('Internal Server Error');
  }
};

/**
 * จัดการข้อความตัวอักษร
 */
async function handleTextMessage(event) {
  const userId = event.source?.userId || '';
  const rawText = event.message.text.trim();
  const lowerText = rawText.toLowerCase();
  const replyToken = event.replyToken;

  // 1. คำสั่งพิเศษสำหรับคุณไจ๋ไจ๋ / แอดมิน ควบคุมบอท
  if (rawText === '#เปิดบอท' || rawText === '#bot') {
    humanTakeoverMap.delete(userId);
    await sendLineReply(replyToken, [{
      type: 'text',
      text: '🤖 เปิดการทำงานบอทอัตโนมัติสำหรับลูกค้ารายนี้เรียบร้อยครับ'
    }]);
    return;
  }

  if (rawText === '#ปิดบอท' || rawText === '#human') {
    humanTakeoverMap.set(userId, { isPaused: true, pausedAt: Date.now() });
    await sendLineReply(replyToken, [{
      type: 'text',
      text: '👤 ปิดบอทเรียบร้อยแล้ว คุณไจ๋ไจ๋สามารถพิมพ์ตอบลูกค้าสดๆ ได้เลยครับ (บอทจะไม่ตอบแทรก)'
    }]);
    return;
  }

  // 2. ตรวจสอบว่าแชทนี้กำลังอยู่ในโหมด "คนกำลังคุย" (Human Hand-off) หรือไม่
  if (isUserUnderTakeover(userId)) {
    // บอทจะเงียบ ไม่ตอบแทรก ให้คุณไจ๋ไจ๋คุยได้อย่างสบายใจ
    return;
  }

  // 3. ตรวจสอบว่ามีเบอร์โทรศัพท์หรือไม่ (เช่น ลูกค้าส่งเบอร์ติดต่อกลับมา)
  const phoneMatch = rawText.match(/0[689]\d{8}/);
  if (phoneMatch) {
    const detectedPhone = phoneMatch[0];
    
    // บันทึกลง Supabase Leads
    await saveLeadToSupabase({
      name: 'ลูกค้าจาก LINE แชท',
      phone: detectedPhone,
      line_id: userId,
      location: 'หาดใหญ่/สงขลา',
      source: 'line_chatbot_tier2'
    });

    // แจ้งเตือนคุณไจ๋ไจ๋ทันที (Tier 2 Alert)
    await notifyJaiJai(
      `🚨 [Lead ด่วนจาก LINE OA]\nลูกค้าแจ้งเบอร์โทรติดต่อกลับ!\nเบอร์: ${detectedPhone}\nข้อความเต็ม: "${rawText}"\nเวลา: ${new Date().toLocaleTimeString('th-TH')}`
    );

    // ตอบกลับลูกค้า
    await sendLineReply(replyToken, [{
      type: 'text',
      text: `☀️ ขอบพระคุณครับ 99 Solar บันทึกเบอร์โทร ${detectedPhone} เรียบร้อยแล้วครับ!\n\nคุณไจ๋ไจ๋ (090-715-1987) จะติดต่อกลับเพื่อให้ข้อมูลและแนะนำขนาดโซลาร์เซลล์ที่คุ้มที่สุดโดยเร็วครับ ⚡`
    }]);
    return;
  }

  // 4. กรองข้อความตามหมวดหมู่ (Tier 1: Direct Matches)
  let replyMessages = [];

  // 4.1 คำนวณค่าไฟ
  if (lowerText.includes('คำนวณ') || lowerText.includes('ค่าไฟ') || lowerText.includes('ลดค่าไฟ') || lowerText.includes('ประหยัด')) {
    replyMessages.push({
      type: 'text',
      text: `☀️ จำลองคำนวณยอดประหยัดค่าไฟบ้านคุณ (หาดใหญ่-สงขลา):\n\nกดเปิดระบบคำนวณออนไลน์ได้ทันทีครับ:\n👉 https://99solar99.vercel.app\n\n(รู้ผลทันทีใน 3 วินาที ว่าบ้านคุณควรติดกี่ kW และประหยัดได้เดือนละกี่บาทครับ)`
    });
  } 
  // 4.2 ราคา / แพ็กเกจ
  else if (lowerText.includes('ราคา') || lowerText.includes('แพ็กเกจ') || lowerText.includes('เท่าไหร่') || lowerText.includes('กี่บาท')) {
    replyMessages.push({
      type: 'text',
      text: `⚡ แพ็กเกจติดตั้งโซลาร์เซลล์มาตรฐาน 99 Solar:\n(ราคารวมติดตั้งครบวงจร + ดำเนินการยื่น กฟภ. ฟรี)\n\n🔹 3.3 kW (ประหยัด ~1,500 - 2,200 บ./ด.)\n➔ เริ่มต้น 119,000 บ.\n\n🔹 5.0 kW (ประหยัด ~2,500 - 3,500 บ./ด.)\n➔ เริ่มต้น 169,000 บ. (ยอดนิยม)\n\n🔹 10.0 kW (ประหยัด ~5,000 - 7,000 บ./ด.)\n➔ เริ่มต้น 289,000 บ.\n\n💳 ผ่อน 0% นาน 10 เดือน หรือผ่อนสบายนาน 84 เดือน\nดูสเปกทั้งหมด: https://99solar99.vercel.app#packages`
    });
  } 
  // 4.3 ใบเสนอราคา
  else if (lowerText.includes('ใบเสนอราคา') || lowerText.includes('ขอราคา') || lowerText.includes('เสนอราคา')) {
    replyMessages.push({
      type: 'text',
      text: `📄 ออกใบเสนอราคาทางการ (PDF A4 มาตรฐาน):\n\nสามารถกรอกข้อมูลออกเอกสารสำหรับยื่นกู้ธนาคาร หรือขออนุมัติงบได้ที่นี่ครับ:\n👉 https://99solar99.vercel.app/quotation.html\n\nหรือส่ง "รูปบิลค่าไฟเดือนล่าสุด" ทิ้งไว้ในแชทนี้ได้เลยครับ เดี๋ยวคุณไจ๋ไจ๋จัดทำใบเสนอราคาให้ทันทีครับ`
    });
  } 
  // 4.4 สัญญา E-Contract
  else if (lowerText.includes('สัญญา') || lowerText.includes('เซ็นสัญญา')) {
    replyMessages.push({
      type: 'text',
      text: `✍️ ระบบเซ็นสัญญาจ้างติดตั้งออนไลน์ (E-Contract):\n\nสัญญาระหว่างลูกค้า กับ บจก. 99 แมทช์ เมคเกอร์ แบ่งชำระ 3 งวด ถูกต้องตามกฎหมาย ใช้นิ้วเซ็นบนมือถือได้ทันทีครับ:\n👉 https://99solar99.vercel.app/contract.html`
    });
  } 
  // 4.5 สำรวจหน้างาน (Tier 2: Auto-reply + Notify JaiJai)
  else if (lowerText.includes('สำรวจ') || lowerText.includes('นัด') || lowerText.includes('ดูหน้างาน')) {
    replyMessages.push({
      type: 'text',
      text: `📍 99 Solar ให้บริการ "สำรวจหน้างานฟรี 100%" ในเขตหาดใหญ่และสงขลาครับ!\n\n• วิศวกรตรวจเช็กทิศทางแดดและโครงสร้างหลังคา\n• ตรวจสอบตู้ไฟ MDB ก่อนยื่นขอ กฟภ.\n• ไม่มีค่าใช้จ่ายและไม่มีข้อผูกมัดใดๆ\n\n📌 พิมพ์ "ชื่อ + เบอร์โทร + พิกัดบ้าน" ทิ้งไว้ได้เลยครับ เดี๋ยวคุณไจ๋ไจ๋ติดต่อกลับนัดหมายทันทีครับ!`
    });
    // แจ้งเตือนคุณไจ๋ไจ๋ว่ามีลูกค้าสนใจนัดสำรวจ
    await notifyJaiJai(`🔔 มีลูกค้าสนใจนัดสำรวจหน้างาน!\nข้อความ: "${rawText}"`);
  } 
  // 4.6 เบอร์โทรติดต่อ
  else if (lowerText.includes('โทร') || lowerText.includes('ติดต่อ') || lowerText.includes('ไจ๋ไจ๋') || lowerText.includes('ช่าง')) {
    replyMessages.push({
      type: 'text',
      text: `📞 สายด่วนติดต่อคุณไจ๋ไจ๋ (ผู้จัดการ บจก. 99 แมทช์ เมคเกอร์):\n\nโทร: 090-715-1987\n(ปรึกษาเรื่องติดตั้ง สเปกอุปกรณ์ ยื่น กฟภ. ฟรีครับ)`
    });
  } 
  // 4.7 ลูกค้าต้องการคุยกับคน / หรืออยู่นอกชุดข้อมูล (Tier 3: Hand-off & Silence Bot)
  else {
    // เข้าสู่โหมด Human Hand-off: พักการทำงานของบอทเพื่อส่งต่อให้คน
    humanTakeoverMap.set(userId, { isPaused: true, pausedAt: Date.now() });

    replyMessages.push({
      type: 'text',
      text: `☀️ ได้รับข้อความเรียบร้อยแล้วครับ!\n\nคำถามนี้คุณไจ๋ไจ๋กำลังตรวจสอบข้อมูล และจะเข้ามาตอบด้วยตัวเองโดยเร็วที่สุดครับ ⚡\n\n(หากต้องการโทรด่วน: 090-715-1987)`
    });

    // ส่ง Alert แจ้งเตือนด่วนหาคุณไจ๋ไจ๋
    await notifyJaiJai(
      `⚠️ [ต้องใช้คนตอบด่วน - ปิดบอทพักสายแล้ว]\nลูกค้าถามว่า: "${rawText}"\n👉 คุณไจ๋ไจ๋สามารถเปิด LINE OA เข้าไปคุยกับลูกค้าได้เลยครับ (บอทหยุดตอบลูกค้ารายนี้แล้ว)\n*เมื่อคุยเสร็จ พิมพ์ #เปิดบอท เพื่อให้บอทเริ่มทำงานใหม่`
    );
  }

  if (replyMessages.length > 0 && CHANNEL_ACCESS_TOKEN) {
    await sendLineReply(replyToken, replyMessages);
  }
}

/**
 * จัดการเมื่อลูกค้ากดปุ่มใน Rich Menu หรือ Flex Message (Postback)
 */
async function handlePostback(event) {
  const userId = event.source?.userId || '';
  const data = event.postback?.data || '';
  const replyToken = event.replyToken;

  // กรณีสลับหน้าริชเมนูผ่าน API
  if (data.startsWith('action=switch_menu')) {
    const params = new URLSearchParams(data);
    const targetMenu = params.get('menu');
    // สามารถต่อยอด linkRichMenuIdToUser ได้ถ้ามีการสร้าง Rich Menu 2 แผ่นไว้ใน LINE Developers
    await sendLineReply(replyToken, [{
      type: 'text',
      text: `🔄 สลับไปยังเมนู: ${targetMenu === 'services' ? 'บริการ & สเปก' : 'หน้าหลัก'}`
    }]);
    return;
  }

  // ปลอบใจตามปุ่มที่กด
  await sendLineReply(replyToken, [{
    type: 'text',
    text: `⚡ รับข้อมูล ${data} เรียบร้อยแล้วครับ ทางคุณไจ๋ไจ๋จะรีบประสานงานให้ทันทีครับ`
  }]);
}

/**
 * จัดการเมื่อมีลูกค้ากดแอดเพื่อนใหม่ (Follow)
 */
async function handleFollow(event) {
  const replyToken = event.replyToken;
  await sendLineReply(replyToken, [{
    type: 'text',
    text: `☀️ ยินดีต้อนรับสู่ 99 Solar หาดใหญ่ ครับ!\n(บจก. 99 แมทช์ เมคเกอร์ • คุณไจ๋ไจ๋ 090-715-1987)\n\nลดค่าไฟบ้านคุณ 40-70% มาตรฐาน กฟภ. 100%\n\n📌 ส่งรูปบิลค่าไฟเดือนล่าสุดทิ้งไว้ได้เลยครับ เดี๋ยวช่วยวิเคราะห์ขนาดกิโลวัตต์ที่คุ้มที่สุดให้ทันทีครับ!\n\n🌐 คำนวณค่าไฟออนไลน์: https://99solar99.vercel.app`
  }]);
}

/**
 * ตรวจสอบว่าแชทนี้กำลังอยู่ในโหมดพักสาย (ให้คนตอบ) หรือไม่
 */
function isUserUnderTakeover(userId) {
  if (!humanTakeoverMap.has(userId)) return false;
  const data = humanTakeoverMap.get(userId);
  if (Date.now() - data.pausedAt > TAKEOVER_TIMEOUT_MS) {
    humanTakeoverMap.delete(userId);
    return false;
  }
  return true;
}

/**
 * ส่งแจ้งเตือนหาคุณไจ๋ไจ๋ผ่าน LINE Push Message
 */
function notifyJaiJai(messageText) {
  return new Promise((resolve) => {
    if (!CHANNEL_ACCESS_TOKEN || !JAIJAI_LINE_USER_ID) {
      console.log('Push notification skipped (missing token or jaijai user id):', messageText);
      return resolve();
    }

    const payload = JSON.stringify({
      to: JAIJAI_LINE_USER_ID,
      messages: [{
        type: 'text',
        text: messageText
      }]
    });

    const options = {
      hostname: 'api.line.me',
      path: '/v2/bot/message/push',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve());
    });

    req.on('error', (err) => {
      console.error('Failed to notify JaiJai:', err);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

/**
 * บันทึก Lead ลง Supabase อัตโนมัติ
 */
function saveLeadToSupabase(leadData) {
  return new Promise((resolve) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return resolve();

    const payload = JSON.stringify(leadData);
    const url = new URL(`${SUPABASE_URL}/rest/v1/solar_leads`);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve());
    });

    req.on('error', (err) => {
      console.error('Supabase Save Error:', err);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

/**
 * ส่ง Reply Message กลับไปหา LINE
 */
function sendLineReply(replyToken, messages) {
  return new Promise((resolve) => {
    if (!CHANNEL_ACCESS_TOKEN) {
      console.warn('⚠️ LINE_CHANNEL_ACCESS_TOKEN is not set yet. Skipped sending reply.');
      return resolve();
    }

    const payload = JSON.stringify({
      replyToken: replyToken,
      messages: messages
    });

    const options = {
      hostname: 'api.line.me',
      path: '/v2/bot/message/reply',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.error('LINE Reply API error:', res.statusCode, responseBody);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      console.error('LINE Request Network Error:', err);
      resolve();
    });

    req.write(payload);
    req.end();
  });
}
