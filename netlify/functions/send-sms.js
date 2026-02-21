// ✅ API 키는 Netlify 환경변수에서 불러옵니다 (코드에 노출 없음)
const SOLAPI_API_KEY    = process.env.SOLAPI_API_KEY;
const SOLAPI_API_SECRET = process.env.SOLAPI_API_SECRET;
const MY_PHONE          = process.env.MY_PHONE;
const SEND_PHONE        = process.env.SEND_PHONE;

const crypto = require('crypto');

function makeSignature(secret, date, salt) {
  return crypto
    .createHmac('sha256', secret)
    .update(date + salt)
    .digest('hex');
}

exports.handler = async function (event) {
  // POST 요청만 허용
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { name, phone, type } = JSON.parse(event.body);

  const date = new Date().toISOString();
  const salt = Math.random().toString(36).substring(2, 22);
  const signature = makeSignature(SOLAPI_API_SECRET, date, salt);

  const text = `[상담신청]\n이름: ${name}\n연락처: ${phone}\n관심평형: ${type}`;

  const response = await fetch('https://api.solapi.com/messages/v4/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `HMAC-SHA256 apiKey=${SOLAPI_API_KEY}, date=${date}, salt=${salt}, signature=${signature}`
    },
    body: JSON.stringify({
      message: {
        to:   MY_PHONE,
        from: SEND_PHONE,
        text: text
      }
    })
  });

  const result = await response.json();

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(result)
  };
};
