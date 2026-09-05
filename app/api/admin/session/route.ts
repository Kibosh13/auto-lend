import { proxyAdmin } from '../proxy';

export const GET = (request: Request) => proxyAdmin(request, 'session');
export const POST = (request: Request) => proxyAdmin(request, 'session');
export const DELETE = (request: Request) => proxyAdmin(request, 'session');
