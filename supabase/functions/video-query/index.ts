const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const url = new URL(req.url);
  const taskId = url.searchParams.get('task_id');
  if (!taskId) {
    return new Response(JSON.stringify({ error: 'task_id required' }), {
      status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const apiKey = Deno.env.get('INTEGRATIONS_API_KEY')!;
    const res = await fetch(
      `https://app-bn2s03zsnx8h-api-pLVzAEz1ZQOL.gateway.appmedo.com/v1/videos/omni-video/${taskId}`,
      { headers: { 'X-Gateway-Authorization': `Bearer ${apiKey}` } },
    );
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
