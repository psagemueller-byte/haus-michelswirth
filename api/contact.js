export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { vorname, name, email, telefon, nachricht } = req.body || {};

    if (!vorname || !name || !email || !nachricht) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const response = await fetch(
            `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fields: {
                        'Vorname': vorname,
                        'Nachname': name,
                        'Email': email,
                        'Telefon': telefon || '',
                        'Nachricht': nachricht
                    }
                })
            }
        );

        if (!response.ok) {
            const err = await response.json();
            return res.status(response.status).json({ error: err });
        }

        return res.status(200).json({ success: true });
    } catch {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
