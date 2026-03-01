const { authenticate } = require('../_utils/auth');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!authenticate(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, AIRTABLE_API_TOKEN } = process.env;

    if (!AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID || !AIRTABLE_API_TOKEN) {
        return res.status(500).json({ error: 'Airtable not configured' });
    }

    try {
        const records = [];
        let offset = null;

        do {
            const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
            url.searchParams.set('sort[0][field]', 'Created');
            url.searchParams.set('sort[0][direction]', 'desc');
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
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
};
