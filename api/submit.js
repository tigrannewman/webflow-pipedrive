export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;
  const PIPEDRIVE_DOMAIN = process.env.PIPEDRIVE_DOMAIN;

  // Debug: Check environment variables
  if (!PIPEDRIVE_API_TOKEN || !PIPEDRIVE_DOMAIN) {
    return res.status(500).json({ 
      success: false, 
      error: 'Missing environment variables',
      hasToken: !!PIPEDRIVE_API_TOKEN,
      hasDomain: !!PIPEDRIVE_DOMAIN
    });
  }

  try {
    const { fullname, emailaddress, phonenumber, companyname, servicename } = req.body;
    const BASE_URL = `https://${PIPEDRIVE_DOMAIN}.pipedrive.com/api/v1`;

    // Step 1: Create Organization
    const orgResponse = await fetch(`${BASE_URL}/organizations?api_token=${PIPEDRIVE_API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: companyname })
    });
    const orgData = await orgResponse.json();
    
    // Debug: If organization creation failed
    if (!orgData.success) {
      return res.status(500).json({ 
        success: false, 
        step: 'organization',
        error: 'Failed to create organization',
        pipedriveResponse: orgData
      });
    }
    const organizationId = orgData.data.id;

    // Step 2: Create Person
    const personResponse = await fetch(`${BASE_URL}/persons?api_token=${PIPEDRIVE_API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fullname,
        email: [emailaddress],
        phone: [phonenumber],
        org_id: organizationId
      })
    });
    const personData = await personResponse.json();
    
    if (!personData.success) {
      return res.status(500).json({ 
        success: false, 
        step: 'person',
        error: 'Failed to create person',
        pipedriveResponse: personData
      });
    }
    const personId = personData.data.id;

    // Step 3: Create Lead
    const leadResponse = await fetch(`${BASE_URL}/leads?api_token=${PIPEDRIVE_API_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${fullname} - ${servicename}`,
        person_id: personId,
        organization_id: organizationId
      })
    });
    const leadData = await leadResponse.json();
    
    if (!leadData.success) {
      return res.status(500).json({ 
        success: false, 
        step: 'lead',
        error: 'Failed to create lead',
        pipedriveResponse: leadData
      });
    }

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
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
}
