import handler, { createServerEntry } from '@tanstack/react-start/server-entry';
import { handleAgentRequest } from './lib/agent-response';

export default createServerEntry({
  async fetch(request, options) {
    return await handleAgentRequest(request, async () => await handler.fetch(request, options));
  },
});
