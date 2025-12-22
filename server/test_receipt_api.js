const http = require('http');

function postRequest(path, data, token) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api' + path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(postData);
        req.end();
    });
}

async function run() {
    try {
        console.log('Logging in...');
        const loginRes = await postRequest('/auth/login', {
            username: 'counter',
            password: 'password123'
        });

        if (loginRes.status !== 200) {
            console.error('Login failed:', loginRes.data);
            return;
        }

        const token = loginRes.data.token;
        console.log('Got token.');

        const payload = {
            vazhipadu: 'pushpanjali',
            vazhipaduType: 'പുഷ്പാഞ്ജലി',
            date: new Date().toISOString(),
            paymentType: 'Cash',
            mode: 'One Day',
            items: [
                {
                    name: 'Test Devotee',
                    nakshatram: 'Aswathi',
                    count: 1,
                    rate: 50,
                    amount: 50
                }
            ]
        };

        console.log('Creating receipt...');
        const receiptRes = await postRequest('/receipts', payload, token);
        console.log('Status:', receiptRes.status);
        if (receiptRes.status === 201) {
            console.log('Success! Receipt ID:', receiptRes.data.receiptNumber);
        } else {
            console.log('Failed:', JSON.stringify(receiptRes.data, null, 2));
        }

    } catch (err) {
        console.error('Script error:', err);
    }
}

run();
