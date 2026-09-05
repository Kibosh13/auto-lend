import { proxyAdmin } from '../proxy';

export const GET = (request: Request) => proxyAdmin(request, 'settings');
export const PUT = (request: Request) => proxyAdmin(request, 'settings');
