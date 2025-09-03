export const runtime = "nodejs";

// Webhook endpoint for fal.ai async processing
export async function POST(req) {
  try {
    const body = await req.json();
    
    // Verify webhook signature (production requirement)
    const signature = req.headers.get('x-fal-signature');
    // In production, verify signature with your webhook secret
    
    console.log('Received fal.ai webhook:', {
      event: body.event_type,
      requestId: body.request_id,
      status: body.status
    });

    // Handle different webhook events
    switch (body.event_type) {
      case 'job.completed':
        console.log('Job completed:', body.result);
        // Here you could:
        // 1. Store result in database
        // 2. Send notification to user
        // 3. Trigger next stage in pipeline
        break;
        
      case 'job.failed':
        console.error('Job failed:', body.error);
        // Handle failure - notify user, retry, etc.
        break;
        
      case 'job.queued':
        console.log('Job queued:', body.request_id);
        break;
        
      default:
        console.log('Unknown event type:', body.event_type);
    }

    // Always return 200 to acknowledge receipt
    return Response.json({ received: true });
    
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}