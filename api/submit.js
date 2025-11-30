export default async function handler(req, res) {
  // Allow requests from your Webflow site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, company, service } = req.body;

    const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
    const PIPEDRIVE_DOMAIN = process.env.PIPEDRIVE_DOMAIN;
    const BASE_URL = `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`;

    // Step 1: Create Organization
    const orgResponse = await fetch(`${BASE_URL}/organizations?api_token=${PIPEDRIVE_API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: company
      })
    });
    const orgData = await orgResponse.json();
    const organizationId = orgData.data.id;

    // Step 2: Create Person (linked to Organization)
    const personResponse = await fetch(`${BASE_URL}/persons?api_token=${PIPEDRIVE_API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: [email],
        phone: [phone],
        org_id: organizationId
      })
    });
    const personData = await personResponse.json();
    const personId = personData.data.id;

    // Step 3: Create Lead (linked to Person and Organization)
    const leadResponse = await fetch(`${BASE_URL}/leads?api_token=${PIPEDRIVE_API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${name} - ${service}`,
        person_id: personId,
        organization_id: organizationId
      })
    });
    const leadData = await leadResponse.json();

    return res.status(200).json({ 
      success: true, 
      message: 'Lead created successfully',
      data: {
        organization: organizationId,
        person: personId,
        lead: leadData.data.id
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Something went wrong' 
    });
  }
}
