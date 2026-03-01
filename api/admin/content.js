const { authenticate } = require('../_utils/auth');

const { AIRTABLE_BASE_ID, AIRTABLE_API_TOKEN } = process.env;
const CONTENT_TABLE = process.env.AIRTABLE_CONTENT_TABLE_ID;

async function airtableFetch(path, options = {}) {
    const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${CONTENT_TABLE}${path}`;
    return fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_TOKEN}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
}

module.exports = async function handler(req, res) {
    if (!authenticate(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_TOKEN || !CONTENT_TABLE) {
        return res.status(500).json({ error: 'Content table not configured' });
    }

    try {
        if (req.method === 'GET') {
            const records = [];
            let offset = null;

            do {
                const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${CONTENT_TABLE}`);
                url.searchParams.set('pageSize', '100');
                if (offset) url.searchParams.set('offset', offset);

                const response = await fetch(url.toString(), {
                    headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
                });

                if (!response.ok) {
                    const err = await response.json();
                    return res.status(response.status).json(err);
                }

                const data = await response.json();
                records.push(...data.records);
                offset = data.offset || null;
            } while (offset);

            return res.status(200).json({ records });
        }

        if (req.method === 'PUT') {
            const { id, key, value } = req.body || {};

            if (!key || value === undefined) {
                return res.status(400).json({ error: 'Key and value required' });
            }

            if (id) {
                const response = await airtableFetch(`/${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        fields: { 'Key': key, 'Value': value },
                        typecast: true,
                    }),
                });
                const data = await response.json();
                if (!response.ok) return res.status(response.status).json(data);
                return res.status(200).json(data);
            } else {
                const response = await airtableFetch('', {
                    method: 'POST',
                    body: JSON.stringify({
                        fields: { 'Key': key, 'Value': value },
                        typecast: true,
                    }),
                });
                const data = await response.json();
                if (!response.ok) return res.status(response.status).json(data);
                return res.status(200).json(data);
            }
        }

        if (req.method === 'DELETE') {
            const { id } = req.body || {};
            if (!id) return res.status(400).json({ error: 'Record ID required' });

            const response = await airtableFetch(`/${id}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) return res.status(response.status).json(data);
            return res.status(200).json(data);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};
