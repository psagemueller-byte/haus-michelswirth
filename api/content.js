module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { AIRTABLE_BASE_ID, AIRTABLE_API_TOKEN } = process.env;
    const CONTENT_TABLE = process.env.AIRTABLE_CONTENT_TABLE_ID;

    if (!AIRTABLE_BASE_ID || !AIRTABLE_API_TOKEN || !CONTENT_TABLE) {
        return res.status(200).json({ content: {} });
    }

    try {
        const url = new URL(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${CONTENT_TABLE}`);
        url.searchParams.set('pageSize', '100');

        const response = await fetch(url.toString(), {
            headers: { 'Authorization': `Bearer ${AIRTABLE_API_TOKEN}` }
        });

        if (!response.ok) {
            return res.status(200).json({ content: {} });
        }

        const data = await response.json();
        const content = {};

        for (const record of data.records) {
            const key = record.fields['Key'];
            const value = record.fields['Value'];
            if (key) content[key] = value || '';
        }

        res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
        return res.status(200).json({ content });
    } catch {
        return res.status(200).json({ content: {} });
    }
};
