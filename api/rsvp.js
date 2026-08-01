module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, lastName, attending, guests, diet, song1, song2, message } =
    req.body || {};

  if (!name || !attending) {
    return res.status(400).json({ error: 'Faltan datos requeridos.' });
  }

  const notionToken = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!notionToken || !databaseId) {
    console.error('Missing NOTION_TOKEN or NOTION_DATABASE_ID env vars');
    return res.status(500).json({ error: 'Notion no está configurado.' });
  }

  try {
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${notionToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          'Nombre completo': {
            title: [{ text: { content: `${name} ${lastName || ''}`.trim() } }],
          },
          Asiste: { select: { name: attending === 'si' ? 'Sí' : 'No' } },
          Acompañantes: { number: Number(guests) || 0 },
          Dieta: { rich_text: [{ text: { content: diet || '' } }] },
          'Canción 1': { rich_text: [{ text: { content: song1 || '' } }] },
          'Canción 2': { rich_text: [{ text: { content: song2 || '' } }] },
          Mensaje: { rich_text: [{ text: { content: message || '' } }] },
        },
      }),
    });

    if (!notionRes.ok) {
      const errBody = await notionRes.text();
      console.error('Notion API error:', notionRes.status, errBody);
      return res.status(502).json({ error: 'No se pudo guardar la confirmación.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('RSVP handler error:', err);
    return res.status(500).json({ error: 'Error interno.' });
  }
};
