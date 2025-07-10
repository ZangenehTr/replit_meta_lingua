// Test SMS sending to +989123838552
import fetch from 'node-fetch';

const KAVENEGAR_API_KEY = '7654583566347270337679396E6F70774B3257693432455A3732786A6E325051';
const baseUrl = 'https://api.kavenegar.com/v1';

async function sendTestSMS() {
  try {
    const url = `${baseUrl}/${KAVENEGAR_API_KEY}/sms/send.json`;
    
    const params = new URLSearchParams({
      receptor: '989123838552', // Remove + for Kavenegar
      message: 'Test SMS from Meta Lingua communication system. Time: ' + new Date().toISOString() + '. Communication APIs are working properly!',
      sender: '10008663' // Default Kavenegar sender
    });

    console.log('Sending SMS to +989123838552...');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    });

    const data = await response.json();
    
    console.log('SMS Response:', JSON.stringify(data, null, 2));
    
    if (data.return && data.return.status === 200) {
      console.log('✅ SMS sent successfully!');
      if (data.entries && data.entries.length > 0) {
        console.log('Message ID:', data.entries[0].messageid);
        console.log('Status:', data.entries[0].statustext);
        console.log('Cost:', data.entries[0].cost);
      }
    } else {
      console.log('❌ SMS failed:', data.return?.message || 'Unknown error');
    }
  } catch (error) {
    console.error('SMS Error:', error.message);
  }
}

sendTestSMS();