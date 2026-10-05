/**
 * 99 Solar Hat Yai - LINE Messaging API Webhook
 * โฮสต์บน Vercel Serverless: https://99solar99.vercel.app/api/line-webhook
 * บริษัท 99 แมทช์ เมคเกอร์ จำกัด (คุณไจ๋ไจ๋ 090-715-1987)
 */

const https = require('https');

// Token จะดึงจาก Environment Variables บน Vercel หรือใช้ค่า Token ที่กำหนด
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

module.exports = async (req, res) => {
  // รองรับทั้ง GET สำหรับเช็กสถานะ และ POST สำหรับรับอีเวนต์จาก LINE
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'online',
      service: '99 Solar LINE Messaging API Webhook',
      company: '99 Match Maker Co., Ltd.',
      time: new Date().toISOString()
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const events = req.body?.events || [];

  // หากเป็นการกด Verify Webhook จากหน้า LINE Developers
  if (events.length === 0) {
    return res.status(200).send('OK (Verified)');
  }

  // วนลูปประมวลผลข้อความจากลูกค้าทีละคน
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
    console.error('Error handling LINE webhook:', error);
    return res.status(500).send('Internal Server Error');
  }
};

// 1. จัดการข้อความที่ลูกค้าพิมพ์มา
async function handleTextMessage(event) {
  const userText = event.message.text.trim().toLowerCase();
  const replyToken = event.replyToken;
  let replyMessages = [];

  if (userText.includes('คำนวณ') || userText.includes('ค่าไฟ') || userText.includes('ลดค่าไฟ')) {
    replyMessages.push({
      type: 'text',
      text: `☀️ จำลองคำนวณยอดประหยัดค่าไฟบ้านคุณ (หาดใหญ่-สงขลา):\n\nกดเปิดระบบคำนวณออนไลน์ได้ทันทีครับ:\n👉 https://99solar99.vercel.app\n\n(รู้ผลทันทีใน 3 วินาที ว่าบ้านคุณควรติดกี่ kW และประหยัดได้เดือนละกี่บาทครับ)`
    });
  } else if (userText.includes('ราคา') || userText.includes('แพ็กเกจ') || userText.includes('เท่าไหร่') || userText.includes('กี่บาท')) {
    replyMessages.push({
      type: 'text',
      text: `⚡ แพ็กเกจติดตั้งโซลาร์เซลล์มาตรฐาน 99 Solar:\n(ราคารวมติดตั้งครบวงจร + ดำเนินการยื่น กฟภ. ฟรี)\n\n🔹 3.3 kW (ประหยัด ~1,500 - 2,200 บ./ด.)\n➔ เริ่มต้น 119,000 บ.\n\n🔹 5.0 kW (ประหยัด ~2,500 - 3,500 บ./ด.)\n➔ เริ่มต้น 169,000 บ. (ยอดนิยม)\n\n🔹 10.0 kW (ประหยัด ~5,000 - 7,000 บ./ด.)\n➔ เริ่มต้น 289,000 บ.\n\n💳 ผ่อน 0% นาน 10 เดือน หรือผ่อนสบายนาน 84 เดือน\nดูสเปกทั้งหมด: https://99solar99.vercel.app#packages`
    });
  } else if (userText.includes('ใบเสนอราคา') || userText.includes('ขอราคา') || userText.includes('เสนอราคา')) {
    replyMessages.push({
      type: 'text',
      text: `📄 ออกใบเสนอราคาทางการ (PDF A4 มาตรฐาน):\n\nสามารถกรอกข้อมูลออกเอกสารสำหรับยื่นกู้ธนาคาร หรือขออนุมัติงบได้ที่นี่ครับ:\n👉 https://99solar99.vercel.app/quotation.html\n\nหรือส่ง "รูปบิลค่าไฟเดือนล่าสุด" ทิ้งไว้ในแชทนี้ได้เลยครับ เดี๋ยวคุณไจ๋ไจ๋จัดทำใบเสนอราคาให้ทันทีครับ`
    });
  } else if (userText.includes('สัญญา') || userText.includes('เซ็นสัญญา')) {
    replyMessages.push({
      type: 'text',
      text: `✍️ ระบบเซ็นสัญญาจ้างติดตั้งออนไลน์ (E-Contract):\n\nสัญญาระหว่างลูกค้า กับ บจก. 99 แมทช์ เมคเกอร์ แบ่งชำระ 3 งวด ถูกต้องตามกฎหมาย ใช้นิ้วเซ็นบนมือถือได้ทันทีครับ:\n👉 https://99solar99.vercel.app/contract.html`
    });
  } else if (userText.includes('สำรวจ') || userText.includes('นัด') || userText.includes('ดูหน้างาน')) {
    replyMessages.push({
      type: 'text',
      text: `📍 99 Solar ให้บริการ "สำรวจหน้างานฟรี 100%" ในเขตหาดใหญ่และสงขลาครับ!\n\n• วิศวกรตรวจเช็กทิศทางแดดและโครงสร้างหลังคา\n• ตรวจสอบตู้ไฟ MDB ก่อนยื่นขอ กฟภ.\n• ไม่มีค่าใช้จ่ายและไม่มีข้อผูกมัดใดๆ\n\n📌 พิมพ์ "ชื่อ + เบอร์โทร + พิกัดบ้าน" ทิ้งไว้ได้เลยครับ เดี๋ยวคุณไจ๋ไจ๋ติดต่อกลับนัดหมายทันทีครับ!`
    });
  } else if (userText.includes('โทร') || userText.includes('ติดต่อ') || userText.includes('ไจ๋ไจ๋') || userText.includes('ช่าง')) {
    replyMessages.push({
      type: 'text',
      text: `📞 สายด่วนติดต่อคุณไจ๋ไจ๋ (ผู้จัดการ บจก. 99 แมทช์ เมคเกอร์):\n\nโทร: 090-715-1987\n(ปรึกษาเรื่องติดตั้ง สเปกอุปกรณ์ ยื่น กฟภ. ฟรีครับ)`
    });
  } else {
    // คำถามอื่นๆ หรือส่งรูปภาพ -> ตอบรับอัตโนมัติอย่างสุภาพ แล้วส่งต่อให้คุณไจ๋ไจ๋
    replyMessages.push({
      type: 'text',
      text: `☀️ ได้รับข้อความเรียบร้อยแล้วครับ!\n\nทางคุณไจ๋ไจ๋และทีมวิศวกรกำลังตรวจสอบข้อมูล และจะรีบตอบกลับข้อความนี้โดยเร็วที่สุดครับ ⚡\n\n🔹 โทรด่วน: 090-715-1987\n🔹 คำนวณค่าไฟออนไลน์: https://99solar99.vercel.app`
    });
  }

  if (replyMessages.length > 0 && CHANNEL_ACCESS_TOKEN) {
    await sendLineReply(replyToken, replyMessages);
  }
}

// 2. จัดการเมื่อลูกค้ากดปุ่มในแชท (Postback)
async function handlePostback(event) {
  const data = event.postback.data;
  const replyToken = event.replyToken;
  // ส่งข้อความตอบกลับตามปุ่มที่กด
  await sendLineReply(replyToken, [{
    type: 'text',
    text: `⚡ รับข้อมูล ${data} เรียบร้อยแล้วครับ ทางคุณไจ๋ไจ๋จะรีบดูแลให้ทันทีครับ`
  }]);
}

// 3. จัดการเมื่อมีลูกค้ากดแอดเพื่อนใหม่ (Follow)
async function handleFollow(event) {
  const replyToken = event.replyToken;
  await sendLineReply(replyToken, [{
    type: 'text',
    text: `☀️ ยินดีต้อนรับสู่ 99 Solar หาดใหญ่ ครับ!\n(บจก. 99 แมทช์ เมคเกอร์ • คุณไจ๋ไจ๋ 090-715-1987)\n\nลดค่าไฟบ้านคุณ 40-70% มาตรฐาน กฟภ. 100%\n\n📌 ส่งรูปบิลค่าไฟเดือนล่าสุดทิ้งไว้ได้เลยครับ เดี๋ยวช่วยวิเคราะห์ขนาดกิโลวัตต์ที่คุ้มที่สุดให้ทันทีครับ!\n\n🌐 คำนวณค่าไฟออนไลน์: https://99solar99.vercel.app`
  }]);
}

// 4. ฟังก์ชันยิง Reply Message กลับไปหา LINE
function sendLineReply(replyToken, messages) {
  return new Promise((resolve, reject) => {
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
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          console.error('LINE Reply API error:', res.statusCode, responseBody);
          resolve(); // ไม่แครช
        }
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
