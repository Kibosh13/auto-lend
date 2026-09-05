import { proxyAdmin } from '../proxy';

export const POST = (request: Request) => proxyAdmin(request, 'assets');
