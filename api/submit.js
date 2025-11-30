export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { fullname, emailaddress, phonenumber, companyname, servicename } = req.body;
    const API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
    const BASE_URL = `https://${process.env.PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`;

    // Create Organization
    const orgRes = await fetch(`${BASE_URL}/organizations?api_token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: companyname })
    });
    const orgId = (await orgRes.json()).data.id;

    // Create Person
    const personRes = await fetch(`${BASE_URL}/persons?api_token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fullname,
        email: [emailaddress],
        phone: [phonenumber],
        org_id: orgId
      })
    });
    const personId = (await personRes.json()).data.id;

    // Create Lead
    const leadRes = await fetch(`${BASE_URL}/leads?api_token=${API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${fullname} - ${servicename}`,
        person_id: personId,
        organization_id: orgId
      })
    });
    const leadId = (await leadRes.json()).data.id;

    return res.status(200).json({ success: true });

  } catch (error) {
    return res.status(500).json({ success: false });
  }
}
