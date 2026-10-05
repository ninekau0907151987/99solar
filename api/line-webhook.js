/**
 * 99 Solar Hat Yai - Advanced 3-Tier LINE Messaging API Webhook
 * โฮสต์บน Vercel Serverless: https://99solar99.vercel.app/api/line-webhook
 * 
 * ระบบ 3 ลำดับขั้น (3-Tier Bot Engine) + Flex Message Cards + Quick Reply + Human Hand-off:
 * 1. Tier 1: Auto-Reply ตอบคำถามทั่วไป (ราคา Flex Card, คำนวณ, สัญญา, สเปก) ทันที
 * 2. Tier 2: Auto-Reply + Alert แจ้งเตือนคุณไจ๋ไจ๋ทันที (ลูกค้านัดหมาย, ทิ้งเบอร์, ขอใบเสนอราคา)
 * 3. Tier 3: Human Takeover เมื่ออยู่นอกเหนือความเข้าใจ บอทส่งข้อความพักสาย สั่ง "ปิดบอทชั่วคราว"
 *             และยิง Alert แจ้งเตือนด่วนให้คุณไจ๋ไจ๋เข้ามาตอบสดทันที โดยที่บอทไม่กวน
 * 4. Flex Message & Quick Reply: ตอบกลับด้วยการ์ดและปุ่มด่วนสวยหรู
 */

const https = require('https');

// ค่า Environment Variables ดึงจาก Vercel
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';
const JAIJAI_LINE_USER_ID = process.env.JAIJAI_LINE_USER_ID || '';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://rvikurxokhlhvilmytil.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2aWt1cnhva2hsaHZpbG15dGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyOTM0NTUsImV4cCI6MjA3NDg2OTQ1NX0.2XQzE2fPz9YVjL49L47rE57C3eD8U2a3H8gqQ_yZ-2I';

// แคชหน่วยความจำสำหรับจำสถานะเปิด/ปิดบอทรายลูกค้า (Human Hand-off)
const humanTakeoverMap = new Map();
const TAKEOVER_TIMEOUT_MS = 12 * 60 * 60 * 1000; // ปิดบอท 12 ชั่วโมง

// ปุ่มลอยด่วน (Quick Reply Items)
function getQuickReplies() {
  return {
    items: [
      {
        type: 'action',
        action: {
          type: 'message',
          label: '☀️ คำนวณค่าไฟ',
          text: 'คำนวณค่าไฟ'
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '⚡ แพ็กเกจราคา',
          text: 'ราคาแพ็กเกจ'
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '📄 ขอใบเสนอราคา',
          text: 'ขอใบเสนอราคา'
        }
      },
      {
        type: 'action',
        action: {
          type: 'message',
          label: '📍 นัดสำรวจฟรี',
          text: 'สนใจนัดสำรวจหน้างานฟรีครับ'
        }
      },
      {
        type: 'action',
        action: {
          type: 'uri',
          label: '📞 โทรหาไจ๋ไจ๋',
          uri: 'tel:0907151987'
        }
      }
    ]
  };
}

// สร้างการ์ด Flex Message แพ็กเกจราคาโซลาร์เซลล์
function getPackageFlexCard() {
  return {
    type: 'flex',
    altText: '⚡ แพ็กเกจติดตั้งโซลาร์เซลล์มาตรฐาน 99 Solar หาดใหญ่',
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        backgroundColor: '#064e3b',
        paddingAll: '16px',
        contents: [
          {
            type: 'text',
            text: '⚡ 99 SOLAR HAT YAI',
            color: '#34d399',
            size: 'xs',
            weight: 'bold'
          },
          {
            type: 'text',
            text: 'แพ็กเกจติดตั้งโซลาร์เซลล์มาตรฐาน',
            color: '#ffffff',
            size: 'md',
            weight: 'bold',
            margin: 'xs'
          },
          {
            type: 'text',
            text: 'มาตรฐาน กฟภ. 100% • ประกันแผง 25 ปี',
            color: '#a7f3d0',
            size: 'xxs',
            margin: 'xs'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            justifyContent: 'space-between',
            contents: [
              {
                type: 'text',
                text: '🔹 3.3 kW (ประหยัด ~1,800 บ./ด.)',
                size: 'xs',
                color: '#334155'
              },
              {
                type: 'text',
                text: '119,000 บ.',
                size: 'xs',
                weight: 'bold',
                color: '#059669'
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            justifyContent: 'space-between',
            contents: [
              {
                type: 'text',
                text: '🔹 5.0 kW (ประหยัด ~3,500 บ./ด.) 🔥',
                size: 'xs',
                weight: 'bold',
                color: '#0f172a'
              },
              {
                type: 'text',
                text: '169,000 บ.',
                size: 'xs',
                weight: 'bold',
                color: '#059669'
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            justifyContent: 'space-between',
            contents: [
              {
                type: 'text',
                text: '🔹 10.0 kW (ประหยัด ~7,000 บ./ด.)',
                size: 'xs',
                color: '#334155'
              },
              {
                type: 'text',
                text: '289,000 บ.',
                size: 'xs',
                weight: 'bold',
                color: '#059669'
              }
            ]
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'text',
            text: '💳 ผ่อน 0% นาน 10 เดือน หรือผ่อนสบายนาน 84 เดือน',
            size: 'xxs',
            color: '#64748b'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#059669',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📄 ออกใบเสนอราคาทางการ (A4)',
              uri: 'https://99solar99.vercel.app/quotation.html'
            }
          },
          {
            type: 'button',
            style: 'secondary',
            height: 'sm',
            action: {
              type: 'uri',
              label: '📞 โทรปรึกษาฟรี 090-715-1987',
              uri: 'tel:0907151987'
            }
          }
        ]
      }
    },
    quickReply: getQuickReplies()
  };
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: '99 Solar Hat Yai - 3-Tier LINE Bot Engine & Flex Cards',
      company: '99 Match Maker Co., Ltd.',
      active_takeovers: humanTakeoverMap.size,
      time: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const events = req.body?.events || [];
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

  // 1. คำสั่งพิเศษสำหรับคุณไจ๋ไจ๋
  if (rawText === '#เปิดบอท' || rawText === '#bot') {
    humanTakeoverMap.delete(userId);
    await sendLineReply(replyToken, [{
      type: 'text',
      text: '🤖 เปิดการทำงานบอทอัตโนมัติสำหรับลูกค้ารายนี้เรียบร้อยครับ',
      quickReply: getQuickReplies()
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
    return; // บอทเงียบ 100%
  }

  // 3. ตรวจสอบเบอร์โทรศัพท์ (Tier 2 Lead Capture)
  const phoneMatch = rawText.match(/0[689]\d{8}/);
  if (phoneMatch) {
    const detectedPhone = phoneMatch[0];
    
    await saveLeadToSupabase({
      name: 'ลูกค้าจาก LINE แชท',
      phone: detectedPhone,
      line_id: userId,
      location: 'หาดใหญ่/สงขลา',
      source: 'line_chatbot_tier2'
    });

    await notifyJaiJai(
      `🚨 [Lead ด่วนจาก LINE OA]\nลูกค้าแจ้งเบอร์โทรติดต่อกลับ!\nเบอร์: ${detectedPhone}\nข้อความเต็ม: "${rawText}"\nเวลา: ${new Date().toLocaleTimeString('th-TH')}`
    );

    await sendLineReply(replyToken, [{
      type: 'text',
      text: `☀️ ขอบพระคุณครับ 99 Solar บันทึกเบอร์โทร ${detectedPhone} เรียบร้อยแล้วครับ!\n\nคุณไจ๋ไจ๋ (090-715-1987) จะติดต่อกลับเพื่อให้ข้อมูลและแนะนำขนาดโซลาร์เซลล์ที่คุ้มที่สุดโดยเร็วครับ ⚡`,
      quickReply: getQuickReplies()
    }]);
    return;
  }

  // 4. กรองข้อความตามหมวดหมู่การแจ้งเตือน (3 Categories)
  let replyMessages = [];

  // ========================================================
  // หมวดหมู่ 1 (🟢 ทั่วไป): บอทตอบจบในตัว ไม่ต้องแจ้งเตือนคุณไจ๋ไจ๋
  // ========================================================

  // 4.1 ราคา / แพ็กเกจ -> ส่ง Flex Message Card สวยหรู (ไม่เตือนคน)
  if (lowerText.includes('ราคา') || lowerText.includes('แพ็กเกจ') || lowerText.includes('เท่าไหร่') || lowerText.includes('กี่บาท')) {
    replyMessages.push(getPackageFlexCard());
  } 
  // 4.2 คำนวณค่าไฟ -> ส่งลิงก์คำนวณ (ไม่เตือนคน)
  else if (lowerText.includes('คำนวณ') || lowerText.includes('ค่าไฟ') || lowerText.includes('ลดค่าไฟ') || lowerText.includes('ประหยัด')) {
    replyMessages.push({
      type: 'text',
      text: `☀️ จำลองคำนวณยอดประหยัดค่าไฟบ้านคุณ (หาดใหญ่-สงขลา):\n\nกดเปิดระบบคำนวณออนไลน์ได้ทันทีครับ:\n👉 https://99solar99.vercel.app\n\n(รู้ผลทันทีใน 3 วินาที ว่าบ้านคุณควรติดกี่ kW และประหยัดได้เดือนละกี่บาทครับ)`,
      quickReply: getQuickReplies()
    });
  } 
  // 4.3 สัญญา E-Contract -> ส่งลิงก์สัญญา (ไม่เตือนคน)
  else if (lowerText.includes('สัญญา') || lowerText.includes('เซ็นสัญญา')) {
    replyMessages.push({
      type: 'text',
      text: `✍️ ระบบเซ็นสัญญาจ้างติดตั้งออนไลน์ (E-Contract):\n\nสัญญาระหว่างลูกค้า กับ บจก. 99 แมทช์ เมคเกอร์ แบ่งชำระ 3 งวด ถูกต้องตามกฎหมาย ใช้นิ้วเซ็นบนมือถือได้ทันทีครับ:\n👉 https://99solar99.vercel.app/contract.html`,
      quickReply: getQuickReplies()
    });
  } 
  // 4.4 เบอร์โทรติดต่อสายด่วน (ไม่เตือนคน)
  else if (lowerText.includes('โทร') || lowerText.includes('ติดต่อ') || lowerText.includes('ไจ๋ไจ๋') || lowerText.includes('ช่าง')) {
    replyMessages.push({
      type: 'text',
      text: `📞 สายด่วนติดต่อคุณไจ๋ไจ๋ (ผู้จัดการ บจก. 99 แมทช์ เมคเกอร์):\n\nโทร: 090-715-1987\n(ปรึกษาเรื่องติดตั้ง สเปกอุปกรณ์ ยื่น กฟภ. ฟรีครับ)`,
      quickReply: getQuickReplies()
    });
  } 

  // ========================================================
  // หมวดหมู่ 2 (🟡 สนใจสูง): บอทตอบรับ + ส่งแจ้งเตือนหลังบ้านมาบอกคุณไจ๋ไจ๋
  // ========================================================

  // 4.5 ใบเสนอราคา -> บอทตอบรับ + แจ้งเตือนหลังบ้าน
  else if (lowerText.includes('ใบเสนอราคา') || lowerText.includes('ขอราคา') || lowerText.includes('เสนอราคา')) {
    replyMessages.push({
      type: 'text',
      text: `📄 ออกใบเสนอราคาทางการ (PDF A4 มาตรฐาน มีตราประทับบริษัท 99 แมทช์ เมคเกอร์ จำกัด):\n\nสามารถกรอกข้อมูลออกเอกสารสำหรับยื่นกู้ธนาคาร หรือขออนุมัติงบได้ที่นี่ครับ:\n👉 https://99solar99.vercel.app/quotation.html\n\nหรือส่ง "รูปบิลค่าไฟเดือนล่าสุด" ทิ้งไว้ในแชทนี้ได้เลยครับ เดี๋ยวคุณไจ๋ไจ๋จัดทำใบเสนอราคาให้ทันทีครับ ⚡`,
      quickReply: getQuickReplies()
    });

    // แจ้งเตือนคุณไจ๋ไจ๋แบบมีฟอร์แมตหลังบ้าน
    await notifyJaiJai(
      `📋 [หมวดหมู่ 2: ลูกค้าสนใจขอใบเสนอราคา]\n` +
      `ข้อความลูกค้า: "${rawText}"\n` +
      `เวลา: ${new Date().toLocaleTimeString('th-TH')}\n` +
      `สถานะ: บอทแนะนำส่งรูปบิลค่าไฟ/ลิงก์แล้ว คุณไจ๋ไจ๋เตรียมตรวจเช็กได้เลยครับ`
    );
  } 
  // 4.6 นัดสำรวจหน้างาน -> บอทตอบรับ + แจ้งเตือนหลังบ้าน
  else if (lowerText.includes('สำรวจ') || lowerText.includes('นัด') || lowerText.includes('ดูหน้างาน')) {
    replyMessages.push({
      type: 'text',
      text: `📍 99 Solar ให้บริการ "สำรวจหน้างานฟรี 100%" ในเขตหาดใหญ่และสงขลาครับ!\n\n• วิศวกรตรวจเช็กทิศทางแดดและโครงสร้างหลังคา\n• ตรวจสอบตู้ไฟ MDB ก่อนยื่นขอ กฟภ.\n• ไม่มีค่าใช้จ่ายและไม่มีข้อผูกมัดใดๆ\n\n📌 พิมพ์ "ชื่อ + เบอร์โทร + พิกัดบ้าน" ทิ้งไว้ได้เลยครับ เดี๋ยวคุณไจ๋ไจ๋ติดต่อกลับนัดหมายทันทีครับ! ⚡`,
      quickReply: getQuickReplies()
    });

    // แจ้งเตือนคุณไจ๋ไจ๋แบบมีฟอร์แมตหลังบ้าน
    await notifyJaiJai(
      `📍 [หมวดหมู่ 2: ลูกค้านัดสำรวจหน้างานฟรี]\n` +
      `ข้อความลูกค้า: "${rawText}"\n` +
      `เวลา: ${new Date().toLocaleTimeString('th-TH')}\n` +
      `สถานะ: บอทขอชื่อ+เบอร์โทรแล้ว คุณไจ๋ไจ๋เตรียมเช็กคิวช่างได้เลยครับ`
    );
  } 

  // ========================================================
  // หมวดหมู่ 3 (🔴 ด่วนที่สุด): คำถามนอกคีย์ / ไม่มีชื่อคนติดต่อ
  // ตอบรับไปก่อนสักครู่ + ปิดบอทพักสาย + รีบแจ้งเตือนคุณไจ๋ไจ๋ด่วนๆ!
  // ========================================================
  else {
    // 1. ปิดบอทพักสายสำหรับลูกค้ารายนี้ (Silence Mode) บอทจะไม่ตอบแทรก
    humanTakeoverMap.set(userId, { isPaused: true, pausedAt: Date.now() });

    // 2. ตอบรับไปก่อนสักครู่
    replyMessages.push({
      type: 'text',
      text: `☀️ ได้รับข้อความเรียบร้อยแล้วครับ!\n\nทางคุณไจ๋ไจ๋ (ผู้จัดการ) กำลังตรวจสอบข้อมูล และจะรีบตอบกลับข้อความนี้ด้วยตัวเองในสักครู่ครับ ⚡\n\n🔹 สายด่วน: 090-715-1987\n🔹 คำนวณค่าไฟออนไลน์: https://99solar99.vercel.app`,
      quickReply: getQuickReplies()
    });

    // 3. รีบมาบอกคุณไจ๋ไจ๋แบบด่วนๆ
    await notifyJaiJai(
      `🔥 [หมวดหมู่ 3: ด่วนที่สุด! คำถามนอกระบบ - ต้องใช้คนตอบ]\n` +
      `ลูกค้าพิมพ์ว่า: "${rawText}"\n` +
      `เวลา: ${new Date().toLocaleTimeString('th-TH')}\n` +
      `สถานะ: บอทตอบรับเบื้องต้นและหยุดทำงานแล้ว\n` +
      `👉 คุณไจ๋ไจ๋เปิดแชท LINE OA เข้าไปคุยสดได้ทันทีเลยครับ!`
    );
  }

  if (replyMessages.length > 0 && CHANNEL_ACCESS_TOKEN) {
    await sendLineReply(replyToken, replyMessages);
  }
}

async function handlePostback(event) {
  const data = event.postback?.data || '';
  const replyToken = event.replyToken;

  if (data.includes('packages')) {
    await sendLineReply(replyToken, [getPackageFlexCard()]);
    return;
  }

  await sendLineReply(replyToken, [{
    type: 'text',
    text: `⚡ รับข้อมูลเรียบร้อยแล้วครับ ทางคุณไจ๋ไจ๋จะรีบดูแลให้ทันทีครับ`,
    quickReply: getQuickReplies()
  }]);
}

async function handleFollow(event) {
  const replyToken = event.replyToken;
  await sendLineReply(replyToken, [
    {
      type: 'text',
      text: `☀️ ยินดีต้อนรับสู่ 99 Solar หาดใหญ่ ครับ!\n(บจก. 99 แมทช์ เมคเกอร์ • คุณไจ๋ไจ๋ 090-715-1987)\n\nลดค่าไฟบ้านคุณ 40-70% มาตรฐาน กฟภ. 100%\n\n📌 ส่งรูปบิลค่าไฟเดือนล่าสุดทิ้งไว้ได้เลยครับ เดี๋ยวช่วยวิเคราะห์ขนาดกิโลวัตต์ที่คุ้มที่สุดให้ทันทีครับ!\n\n🌐 คำนวณค่าไฟออนไลน์: https://99solar99.vercel.app`,
      quickReply: getQuickReplies()
    }
  ]);
}

function isUserUnderTakeover(userId) {
  if (!humanTakeoverMap.has(userId)) return false;
  const data = humanTakeoverMap.get(userId);
  if (Date.now() - data.pausedAt > TAKEOVER_TIMEOUT_MS) {
    humanTakeoverMap.delete(userId);
    return false;
  }
  return true;
}

function notifyJaiJai(messageText) {
  return new Promise((resolve) => {
    if (!CHANNEL_ACCESS_TOKEN || !JAIJAI_LINE_USER_ID) {
      console.log('Push notification skipped:', messageText);
      return resolve();
    }

    const payload = JSON.stringify({
      to: JAIJAI_LINE_USER_ID,
      messages: [{ type: 'text', text: messageText }]
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

function sendLineReply(replyToken, messages) {
  return new Promise((resolve) => {
    if (!CHANNEL_ACCESS_TOKEN) {
      console.warn('⚠️ LINE_CHANNEL_ACCESS_TOKEN is not set yet.');
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
