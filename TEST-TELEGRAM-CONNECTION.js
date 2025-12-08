// Quick test script to verify Telegram bot connection
// Copy this code to browser console and run it

const BOT_TOKEN = '8284872428:AAEd3KeaWLLHJaDv5p1oN0E5To75LWwupDg';
const CHAT_ID = '-5049984660';

async function testTelegramConnection() {
  try {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const payload = {
      chat_id: CHAT_ID,
      text: '🎉 <b>Test Connection Successful!</b>\n\nTelegram bot is now properly configured for SSTH Inventory System.\n\n<i>Message from test script</i>',
      parse_mode: 'HTML',
      disable_web_page_preview: true
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.ok) {
      console.log('✅ Telegram bot connection successful!');
      console.log('Message sent:', data.result);
    } else {
      console.error('❌ Failed to send message:', data);
    }
  } catch (error) {
    console.error('❌ Error testing Telegram connection:', error);
  }
}

// Run the test
testTelegramConnection();